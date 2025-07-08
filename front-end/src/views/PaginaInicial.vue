<template>
  <NavegadorSidebar />

  <v-dialog v-model="dialogoRemocao" id="dialogo-remocao">
    <v-card rounded="lg" max-width="400" class="align-center ma-auto" elevation="24">
      <v-icon class="ma-5" color="warning" size="100px"> mdi-alert-outline </v-icon>
      <v-card-title>Remover ação da lista</v-card-title>
      <v-card-text class="text-center">
        Confirmar remoção do ticker
        <span class="font-weight-bold ma-0">{{ tickerParaRemover }}</span>
        ?
        <br />(Você poderá adicioná-lo novamente depois)
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-btn @click="dialogoRemocao = false">Cancelar</v-btn>
        <v-btn variant="outlined" @click="removerAcao" prepend-icon="mdi-delete" color="error"
          >Remover</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>

  <div class="tabela-wrapper">
    <v-container class="pa-0 tabela-container">
      <h4 class="text-h3 text-center ma-2">Mercado de Ações</h4>
      <div class="tabela-box">
        <!-- Cabeçalho fixo -->
        <v-row class="bg-primary font-weight-bold pa-2 pt-1 pb-1" no-gutters>
          <v-col cols="2">Ticker</v-col>
          <v-col cols="2" class="text-end">Preço</v-col>
          <v-col class="text-end">Variação $</v-col>
          <v-col class="text-end">Variação %</v-col>
          <v-col cols="2" class="text-center"></v-col>
        </v-row>

        <!-- Parte rolável -->
        <div class="scroll-tabela d-flex flex-column">
          <LinhaAcaoInteresse
            class="pl-2 pr-2"
            @removerAcao="abrirDialogoRemocao"
            v-for="(acao, i) in acoesInteresse"
            :key="i"
            :acao="acao"
            :index="i"
          />
        </div>

        <div class="d-flex w-100 h-100" v-if="acoesInteresse.length === 0">
          <v-card class="align-center pa-5 justify-center text-center w-100 h-100">
            <v-icon size="75px">mdi-alert-box-outline</v-icon>
            <v-card-title>Ops!</v-card-title>
            <v-card-text
              >Parece que você não possui ações de interesse para serem exibidas. <br />Adicione
              ações de interesse para vê-las nessa lista</v-card-text
            >
          </v-card>
        </div>
      </div>
    </v-container>

    <v-btn @click="abrirDialogoAdicao" class="ma-5 bg-primary" prepend-icon="mdi-plus-box">
      Adicionar ação</v-btn
    >
    <v-dialog v-model="dialogoAdicao" max-width="400">
      <v-card rounded="lg" class="align-center ma-auto" elevation="24">
        <v-card-title class="text-h6 text-center" style="font-size: 1rem">
          Qual ação deseja adicionar?
        </v-card-title>

        <v-card-text
          class="lista-outline"
          style="max-height: 300px; overflow-y: auto; padding-top: 0"
        >
          <v-row
            class="align-center justify-center py-1"
            v-for="(acao) in acoesMercado.filter(
              (acaoMercado) =>
                !acoesInteresse.some(
                  (acaoInteresse) => acaoInteresse.ticker === acaoMercado.ticker,
                ),
            )"
            :key="acao.ticker"
            no-gutters
          >
            <v-col cols="7" class="px-2" style="font-size: 0.9rem">
              {{ acao.ticker }}
            </v-col>
            <v-col cols="5" class="px-2 text-right">
              <v-btn
                @click="adicionarAcaoInteresse(acao.ticker)"
                size="small"
                min-width="80px"
                color="success"
                variant="outlined"
                dense
              >
                Adicionar
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogoAdicao = false">Cancelar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavegadorSidebar from '@/components/NavegadorSidebar.vue';
import LinhaAcaoInteresse from '@/components/LinhaAcaoInteresse.vue';
import axios from 'axios';
import { config } from '@/config';

const acoesInteresse = ref([]);
const acoesMercado = ref([]);
const dialogoRemocao = ref(false);
const dialogoAdicao = ref(false);
const tickerParaRemover = ref('');
const indexParaRemover = ref('');

async function removerAcao() {
  try {
    await axios.delete(`${config.apiUrl}/acoes/acaoInteresse/remover`, {
      data: {
        ordemAcao: indexParaRemover.value + 1,
      },
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    acoesInteresse.value.splice(indexParaRemover.value, 1);
    dialogoRemocao.value = false;
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

async function buscarAcoesInteresse() {
  try {
    const response = await axios.get(`${config.apiUrl}/acoes/acaoInteresse`, {
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

async function buscarAcoesMercado() {
  try {
    const response = await axios.get(`${config.apiUrl}/acoes/listarAcoesMercado`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (err) {
    return [];
  }
}

function abrirDialogoRemocao(ticker, index) {
  tickerParaRemover.value = ticker;
  indexParaRemover.value = index;
  dialogoRemocao.value = true;
}

async function abrirDialogoAdicao() {
  acoesMercado.value = await buscarAcoesMercado();
  dialogoAdicao.value = true;
}

async function adicionarAcaoInteresse(ticker) {
  try {
    await axios.post(
      `${config.apiUrl}/acoes/acaoInteresse/adicionar`,
      { ticker: ticker },
      {
        headers: {
          Authorization: `Bearer: ${localStorage.getItem('token')}`,
        },
      },
    );
    acoesInteresse.value = await buscarAcoesInteresse();
  } catch (err) {
    console.log(err);
  } finally {
    dialogoAdicao.value = false;
  }
}

onMounted(async () => {
  acoesInteresse.value = await buscarAcoesInteresse();
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
  max-width: 720px;
}

.tabela-box {
  border: 2px solid #3f51b5;
  height: 260px;
  overflow: hidden;
  border-radius: 5px;
}

.scroll-tabela {
  max-height: 224px;
  overflow-y: auto;
}

.bg-secondary-lighten-2 {
  background-color: #303030;
}

.lista-outline {
  max-height: 300px;
  border-radius: 5px;
  border: 1px solid #303030
}
</style>
