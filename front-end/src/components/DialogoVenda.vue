<template>
  <v-dialog v-model="dialogoVisivel" max-width="500">
    <v-card>
      <v-card-title class="text-h6">Confirmação de Venda</v-card-title>
      <v-card-text>
        <p>Você deseja vender <strong>{{ quantidade }}</strong> ações de <strong>{{ ticker }}</strong> pelo valor de <strong>R$ {{ preco }}</strong>?</p>
        <v-select
          v-model="modoVenda"
          :items="modos"
          label="Modo de venda"
          dense
        ></v-select>
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

const props = defineProps({
  ticker: String,
  preco: Number,
  quantidade: Number,
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue', 'vendaFinalizada']);

const dialogoVisivel = ref(props.modelValue);
const modoVenda = ref('Mercado');
const modos = ['Mercado', 'Limitada'];

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

    if (modoVenda.value === 'Mercado') {
      await axios.post(
        `${config.apiUrl}/acoes/ordemVenda/mercado`,
        {
          ticker: props.ticker,
          quantidade: props.quantidade,
        },
        {
          headers: {
            Authorization: `Bearer: ${token}`,
          },
        }
      );
    } else {
      await axios.post(
        `${config.apiUrl}/acoes/ordemVenda/limitada`,
        {
          ticker: props.ticker,
          quantidade: props.quantidade,
          precoReferencia: props.preco,
        },
        {
          headers: {
            Authorization: `Bearer: ${token}`,
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
      mensagem:
        err.response?.data?.message || 'Erro ao tentar vender as ações.',
    });
  }
}
</script>