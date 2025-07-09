<template>
  <v-dialog v-model="dialogoCompra" max-width="400">
    <v-card rounded="lg" elevation="24">
      <v-card-title class="text-center">
        <div class="w-100">
          <h1 class="text-h6 mb-2">Compra de ação</h1>
          <v-divider class="mb-2" />
          <div class="text-subtitle-1">Ticker: {{ acao.ticker }}</div>
          <div class="text-subtitle-1">Preço atual: R$ {{ acao.preco.toFixed(2) }}</div>
        </div>
      </v-card-title>

      <v-card-text>
        <v-row class="align-center justify-center my-4" dense>
          <span class="mr-2">Quantidade:</span>


          <v-text-field
            v-model.number="quantidade"
            type="number"
            min="1"
            class="mx-2"
            style="max-width: 100px"
            density="compact"
            hide-details
            variant="outlined"
          />



        </v-row>

        <v-radio-group v-model="tipoCompra" density="compact" hide-details>
          <v-radio label="Comprar a preço de mercado" value="mercado" />
          <v-radio label="Comprar limitado a um preço" value="limitada" />
        </v-radio-group>

        <v-text-field
          v-if="tipoCompra === 'limitada'"
          v-model.number="precoLimite"
          label="Preço limite (R$)"
          type="number"
          density="compact"
          variant="outlined"
          hide-details
          class="mt-2"
        />
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn text @click="fecharDialogo">Cancelar</v-btn>
        <v-btn color="success" variant="outlined" @click="realizarOrdemCompra"> Confirmar </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import axios from 'axios';
import { ref, defineEmits } from 'vue';
import { config } from '@/config';
import { computed } from 'vue';

const sucesso = ref(null);
const mensagemRequisicao = ref('');
const precoLimite = ref(0);

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  ticker: {
    type: String,
    required: true,
  },
  preco: {
    type: Number,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue', 'compraFinalizada']);

const dialogoCompra = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});
const quantidade = ref(1);
const tipoCompra = ref('mercado'); // agora só essa controla o tipo

const acao = computed(() => ({
  ticker: props.ticker,
  preco: props.preco,
}));

function incrementar() {
  quantidade.value++;
}

function decrementar() {
  if (quantidade.value > 1) {
    quantidade.value--;
  }
}

function fecharDialogo() {
  dialogoCompra.value = false;
}

async function realizarOrdemCompra() {
  console.log({
    ticker: acao.value.ticker,
    quantidade: quantidade.value,
  });

  let response;
  try {
    response = await axios.post(
      `${config.apiUrl}/acoes/ordemCompra/${tipoCompra.value}`,
      {
        ticker: props.ticker,
        quantidade: quantidade.value,
        precoReferencia: precoLimite.value, //Apenas o endpoint /acoes/ordemCompra/limite que usa esse campo
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Bearer: ${localStorage.getItem('token')}`,
        },
      },
    );

    mensagemRequisicao.value = response.data.message;
    sucesso.value = true;
  } catch (err) {
    mensagemRequisicao.value = err.response?.data?.message || 'Erro ao realizar a ordem de compra.';
    sucesso.value = false;
  }

  emit('compraFinalizada', {
    sucesso: sucesso.value,
    mensagem: mensagemRequisicao.value,
  });

  fecharDialogo();
}
</script>
