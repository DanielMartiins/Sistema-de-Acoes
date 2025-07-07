<template>
  <NavegadorSidebar />
  <div class="d-flex justify-center" style="height: 100vh; padding-top: 2rem; padding-bottom: 2rem">
    <v-container class="pa-4" style="max-width: 720px">
      <v-row class="bg-primary">
        <v-col>Ticker</v-col>
        <v-col class="text-end">Preço</v-col>
        <v-col class="text-end">Variação $</v-col>
        <v-col class="text-end">Variação %</v-col>
      </v-row>

      <v-row
        v-for="(acao, index) in acoes"
        :key="index"
        :class="index % 2 !== 0 ? 'bg-secondary-lighten' : 'bg-secondary'"
      >
        <v-col>{{ acao.ticker }}</v-col>
        <v-divider vertical />

        <v-col class="text-end">{{ acao.preco.toFixed(2) }}</v-col>
        <v-divider vertical />

        <v-col class="text-end" :class="classeVariacao(acao.variacaoNominal)">
          <v-icon v-if="acao.variacaoNominal !== 0" size="small">
            {{ iconeVariacao(acao.variacaoNominal) }}
          </v-icon>
          <span class="numero-fixo-largura">{{ acao.variacaoNominal.toFixed(2) }}</span>
        </v-col>
        <v-divider vertical />

        <v-col class="text-end" :class="classeVariacao(acao.variacaoPercentual)">
          <v-icon v-if="acao.variacaoPercentual !== 0" size="small">
            {{ iconeVariacao(acao.variacaoPercentual) }}
          </v-icon>
          <span class="numero-fixo-largura">{{ acao.variacaoPercentual.toFixed(2) }}%</span>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import NavegadorSidebar from '@/components/NavegadorSidebar.vue';
import axios from 'axios';
import { config } from '@/config';

const acoes = ref([]);

function classeVariacao(valor) {
  if (valor > 0) return 'text-success';
  if (valor < 0) return 'text-error';
  return '';
}

function iconeVariacao(valor) {
  if (valor > 0) return 'mdi-arrow-up';
  if (valor < 0) return 'mdi-arrow-down';
  return '';
}

async function listarAcoesInteresse() {
  try {
    const response = await axios.get(`${config.apiUrl}/acoes/acaoInteresse`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return response.data;
  } catch (err) {
    console.log(err);
    return null;
  }
}

listarAcoesInteresse().then((listaAcoes) => {
  acoes.value = listaAcoes;
  console.log(acoes.value);
});
</script>

<style scoped>
.bg-secondary-lighten {
  background-color: #252525; /* versão mais clara do bg-secondary */
}

.numero-fixo-largura {
  display: inline-block;
  width: 50%;
  min-width: 45px;
  max-width: 70px;
  text-align: right;
}
</style>
