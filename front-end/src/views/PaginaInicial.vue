<template>
  <NavegadorSidebar />
  <div class="tabela-wrapper">
    <v-container class="pa-0 tabela-container">
      <h4 class="text-h3 text-center ma-2">Ações de Interesse</h4>
      <div class="tabela-box">
        <!-- Cabeçalho fixo -->
        <v-row class="bg-primary font-weight-bold" no-gutters>
          <v-col cols="2">Ticker</v-col>
          <v-col cols="2" class="text-end">Preço</v-col>
          <v-col class="text-end">Variação $</v-col>
          <v-col class="text-end">Variação %</v-col>
          <v-col cols="2" class="text-center"></v-col>
        </v-row>

        <!-- Parte rolável -->
        <div class="scroll-tabela d-flex flex-column">
          <LinhaAcaoInteresse
            @removerAcao="abrirDialogoRemocao"
            v-for="(acao, i) in acoes"
            :key="i"
            :acao="acao"
            :index="i"
          />
        </div>
      </div>
    </v-container>
  </div>
  <v-dialog v-model="dialogoRemocao">
    <v-card rounded="lg" max-width="400" class="align-center ma-auto">
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
        <v-btn @click="removerAcao" prepend-icon="mdi-delete" color="error">Remover</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavegadorSidebar from '@/components/NavegadorSidebar.vue';
import LinhaAcaoInteresse from '@/components/LinhaAcaoInteresse.vue';
import axios from 'axios';
import { config } from '@/config';

const acoes = ref([]);
const dialogoRemocao = ref(false);
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

    acoes.value.splice(indexParaRemover.value, 1)
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

function abrirDialogoRemocao(ticker, index) {
  tickerParaRemover.value = ticker;
  indexParaRemover.value = index;
  dialogoRemocao.value = true;
}

onMounted(async () => {
  acoes.value = await buscarAcoesInteresse();
});
</script>

<style scoped>
.tabela-wrapper {
  height: 100vh;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabela-container {
  width: 99%;
  max-width: 720px;
}

.tabela-box {
  border: 2px solid #555;
  height: 260px;
  overflow: hidden;
}

.scroll-tabela {
  max-height: 232px;
  overflow-y: auto;
}

.bg-secondary-lighten-2 {
  background-color: #303030;
}
</style>
