<template>
  <NavegadorSidebar />
  <div class="tabela-wrapper">
    <v-container class="pa-0 tabela-container">
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
          <LinhaAcaoInteresse v-for="(acao, i) in acoes" :key="i" :acao="acao" :index="i" />
        </div>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import NavegadorSidebar from '@/components/NavegadorSidebar.vue';
import LinhaAcaoInteresse from '@/components/LinhaAcaoInteresse.vue';
import axios from 'axios';
import { config } from '@/config';

const acoes = ref([]);

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

onMounted(async () => {
  acoes.value = await buscarAcoesInteresse();
});
</script>

<style scoped>
.tabela-wrapper {
  height: 75vh;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabela-container {
  width: 100%;
  max-width: 1080px;
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
</style>
