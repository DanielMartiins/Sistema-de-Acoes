<template>
  <!--Conteúdo principal da página-->
  <div class="tabela-wrapper">
    <v-container class="pa-0 tabela-container">
      <h2 class="text-h2 text-center ma-2">Minha carteira</h2>
      <h4 class="text-h4 text-center ma-2">
        <v-icon size="30px">mdi-clock-outline</v-icon
        >{{ `14:${String(minutoNegociacao).padStart(2, '0')}` }}
      </h4>
      <div class="tabela-box">
        <!-- Cabeçalho fixo -->
        <v-row
          class="text-subtitle-2 align-center bg-primary font-weight-bold pa-2 pt-1 pb-1"
          no-gutters
        >
          <v-col cols="1" class="text-start">Ticker</v-col>
          <v-col class="text-center">Compra média $</v-col>
          <v-col class="text-center">Venda média $</v-col>
          <v-col class="text-center">Qtde. disponível</v-col>
          <v-col class="text-center">Qtde. vendida</v-col>
          <v-col class="text-center">Ganho/Perda $</v-col>
          <v-col class="text-end"></v-col>
        </v-row>

        <!-- Parte rolável -->
        <div class="scroll-tabela d-flex h-100 flex-column">
          <LinhaAcaoCarteira
            class="pl-2 pr-2"
            v-for="(acao, i) in acoesCarteira"
            :key="i"
            :acao="acao"
            :index="i"
          />
          <div
            class="d-flex bg-secondary flex-column align-center justify-center w-100 h-100"
            v-if="acoesCarteira.length === 0"
          >
            <v-card class="pa-5 text-center" elevation="0">
              <v-icon size="75px">mdi-alert-box-outline</v-icon>
              <v-card-text
                >Parece que você não possui ações na sua carteira. <br />Compre ações no mercado
                para vê-las nessa lista!</v-card-text
              >
            </v-card>
          </div>
          <div
            class="opacity-60 d-flex bg-secondary flex-column align-center w-100 h-100"
            v-if="acoesCarteira.length !== 0"
          >
            <v-card class="d-flex text-center opacity-60" min-height="75" elevation="0">
              <v-icon class="pt-5" size="30px">mdi-information-outline</v-icon>
              <v-card-text class="text-caption">Nenhuma ação a mais para exibir.</v-card-text>
            </v-card>
          </div>
        </div>
      </div>
    </v-container>

    <!-- Botões para mexer no relógio -->
    <div class="d-flex">
      <div>
        <span></span>
        <v-btn
          text="+1 Min"
          :disabled="minutoNegociacao + 1 >= 60"
          @click="avancarRelogio(1)"
          class="mt-5 mr-1 bg-secondary-lighten-2"
        />
        <v-btn
          text="+5 Min"
          :disabled="minutoNegociacao + 5 >= 60"
          @click="avancarRelogio(5)"
          class="mt-5 ml-1 bg-secondary-lighten-2"
        />
      </div>
    </div>

    <!-- Botao e diálogo para comprar uma ação da lista -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { config } from '@/config';
import LinhaAcaoCarteira from '@/components/LinhaAcaoCarteira.vue';

const acoesCarteira = ref([]);
const minutoNegociacao = ref(0);

async function buscarAcoesCarteira() {
  try {
    const response = await axios.get(`${config.apiUrl}/carteira`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function obterMinutoNegociacao() {
  const response = await axios.get(`${config.apiUrl}/acoes/horaNegociacao`, {
    headers: {
      Authorization: `Bearer: ${localStorage.getItem('token')}`,
    },
  });
  const minuto = response.data;
  console.log(minuto);
  return minuto;
}

async function avancarRelogio(acrescimo) {
  const token = localStorage.getItem('token');
  const novoMinuto = minutoNegociacao.value + parseInt(acrescimo);

  try {
    const response = await axios.put(
      `${config.apiUrl}/acoes/horaNegociacao/atualizar`,
      { novoMinuto },
      {
        headers: {
          Authorization: `Bearer: ${token}`, // com dois pontos, conforme seu backend
        },
      },
    );

    console.log(response.data.message); // "Hora de negociação atualizada para 14:xx com sucesso."
    // aqui você pode atualizar UI, exibir alerta, etc.
  } catch (err) {
    if (err.response) {
      console.error('Erro do servidor:', err.response.data.message);
    } else {
      console.error('Erro de rede:', err.message);
    }
  }

  minutoNegociacao.value = await obterMinutoNegociacao();
  acoesCarteira.value = await buscarAcoesCarteira();
}

onMounted(async () => {
  acoesCarteira.value = await buscarAcoesCarteira();
  minutoNegociacao.value = await obterMinutoNegociacao();
});
</script>

<style scoped>
.tabela-wrapper {
  height: 100vh;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.tabela-container {
  width: 99%;
  max-width: 1080px;
}

.tabela-box {
  border: 2px solid #3f51b5;
  height: 380px;
  overflow: hidden;
  border-radius: 5px;
}

.scroll-tabela {
  max-height: 480px;
  overflow-y: auto;
}

.bg-secondary-lighten-2 {
  background-color: #303030;
}

.lista-outline {
  max-height: 300px;
  border-radius: 5px;
  border: 1px solid #303030;
}


::v-deep(.v-btn.v-btn--disabled) {
  opacity: 0.3 !important; /* evita que fique apagado demais */
  background-color: #272727 !important; /* cor de fundo quando desativado */
  cursor: not-allowed;
}


</style>
