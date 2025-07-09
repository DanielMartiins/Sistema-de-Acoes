<template>
  <v-dialog v-model="dialogoVisivel" max-width="500">
    <v-card>
      <v-card-title class="text-h6">Confirmação de Venda</v-card-title>
      <v-card-text>
        <p>
          Você deseja vender <strong>{{ quantidade }}</strong> ações de
          <strong>{{ ticker }}</strong>
          <span v-if="modoVenda === 'mercado' && typeof preco === 'number'">
            pelo valor atual de <strong>R$ {{ precoLimiteFormatado }}</strong>?
          </span>
          <span v-if="modoVenda === 'limitada'">
            com preço mínimo de <strong>R$ {{ precoLimiteFormatado }}</strong>?
          </span>
        </p>

        <v-radio-group v-model="modoVenda" density="compact" hide-details>
          <v-radio label="Vender a preço de mercado" value="mercado" />
          <v-radio label="Venda limitada por preço" value="limitada" />
        </v-radio-group>

        <v-text-field
          v-if="modoVenda === 'limitada'"
          v-model.number="precoLimite"
          label="Preço mínimo (R$)"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          class="mt-2"
        />

      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="fechar">Cancelar</v-btn>
        <v-btn color="error" @click="confirmarVenda">Confirmar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import { config } from '@/config';
import { computed } from 'vue';

const precoLimiteFormatado = computed(() => {
  const precoNum = Number(precoLimite.value);
  return isNaN(precoNum) ? '0.00' : precoNum.toFixed(2);
});

const props = defineProps({
  ticker: String,
  preco: Number,
  quantidade: Number,
  modelValue: Boolean,
});
const emit = defineEmits(['update:modelValue', 'vendaFinalizada']);

const dialogoVisivel = ref(props.modelValue);
const modoVenda = ref('mercado');
const precoLimite = ref(0);
const modos = ['mercado', 'limitada'];

watch(
  () => props.modelValue,
  (novoValor) => {
    dialogoVisivel.value = novoValor;
  }
);

watch(dialogoVisivel, (valor) => {
  emit('update:modelValue', valor);
});

function fechar() {
  dialogoVisivel.value = false;
}

async function confirmarVenda() {
  try {
    const token = localStorage.getItem('token');

    if (modoVenda.value === 'mercado') {
      await axios.post(
        `${config.apiUrl}/acoes/ordemVenda/mercado`,
        {
          ticker: props.ticker,
          quantidade: props.quantidade,
        },
        {
          headers: {
            Authorization: `Bearer: ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    } else {
      await axios.post(
        `${config.apiUrl}/acoes/ordemVenda/limitada`,
        {
          ticker: props.ticker,
          quantidade: props.quantidade,
          precoReferencia: precoLimite.value,
        },
        {
          headers: {
            Authorization: `Bearer: ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
    }

    emit('vendaFinalizada', {
      sucesso: true,
      mensagem: 'Venda registrada com sucesso.',
    });
    fechar();
  } catch (err) {
    emit('vendaFinalizada', {
      sucesso: false,
      mensagem: err.response?.data?.message || 'Erro ao tentar vender as ações.',
    });
  }
}
</script>
