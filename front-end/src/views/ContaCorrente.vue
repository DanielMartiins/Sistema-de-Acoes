<template>
  <div class="tabela-wrapper">
    <v-sheet class="pa-10" style="max-width: 500px; width: 100%">
      <p class="text-h6 mb-4">Saldo: <strong>R$ {{ saldo.toFixed(2) }}</strong></p>

      <v-text-field
        label="Valor do Depósito"
        v-model="valorDeposito"
        type="number"
        prefix="R$ "
        dense
        outlined
        min="0"
      />

      <v-btn
        color="primary"
        class="mt-2"
        @click="fazerDeposito"
        :disabled="valorDeposito <= 0"
      >
        Depositar
      </v-btn>

      <v-divider class="my-4" />

      <v-text-field
        label="Valor do Débito"
        v-model="valorDebito"
        type="number"
        prefix="R$ "
        dense
        outlined
        min="0"
      />

      <v-btn
        color="error"
        class="mt-2"
        @click="fazerDebito"
        :disabled="valorDebito <= 0"
      >
        Debitar
      </v-btn>

      <v-alert
        v-if="mensagem"
        :type="tipoMensagem"
        class="mt-4"
        dense
        border="start"
        variant="tonal"
        prominent
      >
        {{ mensagem }}
      </v-alert>

      <v-divider class="my-6" />

      <div v-if="lancamentos.length > 0">
        <h3 class="text-h6 mb-2">Extrato da Conta Corrente</h3>
        <v-table density="compact" class="text-caption">
          <thead>
            <tr>
              <th>Data</th>
              <th>Valor</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(lanc, index) in lancamentos" :key="index">
              <td>{{ lanc.data_hora }}</td>
              <td :class="lanc.valor >= 0 ? 'text-success' : 'text-error'">
                R$ {{ lanc.valor.toFixed(2) }}
              </td>
              <td>
                {{
                  typeof lanc.historico === 'string'
                    ? JSON.parse(lanc.historico).descricao
                    : lanc.historico.descricao
                }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <div v-else class="text-center mt-4 text-grey">
        Nenhum lançamento encontrado.
      </div>
    </v-sheet>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { config } from '@/config';

const saldo = ref(0);
const valorDeposito = ref(0);
const valorDebito = ref(0);
const mensagem = ref('');
const tipoMensagem = ref('success');
const lancamentos = ref([]);

async function carregarContaCorrente() {
  try {
    const response = await axios.get(`${config.apiUrl}/contaCorrente`, {
      headers: {
        Authorization: `Bearer: ${localStorage.getItem('token')}`,
      },
    });
    saldo.value = response.data.saldo;
    lancamentos.value = response.data.lancamentos || [];
  } catch (error) {
    mensagem.value = 'Erro ao buscar saldo/lancamentos.';
    tipoMensagem.value = 'error';
  }
}

async function fazerDeposito() {
  if (valorDeposito.value <= 0) {
    mensagem.value = 'Informe um valor válido para depósito.';
    tipoMensagem.value = 'error';
    return;
  }

  try {
    await axios.post(
      `${config.apiUrl}/contaCorrente/depositar`,
      {
        valor: parseFloat(valorDeposito.value),
        descricao: `Depósito de R$ ${parseFloat(valorDeposito.value).toFixed(2)}`,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    await carregarContaCorrente();
    mensagem.value = 'Depósito realizado com sucesso!';
    tipoMensagem.value = 'success';
    valorDeposito.value = 0;
  } catch (error) {
    mensagem.value = error.response?.data?.message || 'Erro ao realizar depósito.';
    tipoMensagem.value = 'error';
  }
}

async function fazerDebito() {
  if (valorDebito.value <= 0) {
    mensagem.value = 'Informe um valor válido para débito.';
    tipoMensagem.value = 'error';
    return;
  }

  try {
    await axios.post(
      `${config.apiUrl}/contaCorrente/debitar`,
      {
        valor: parseFloat(valorDebito.value),
        descricao: `Débito de R$ ${parseFloat(valorDebito.value).toFixed(2)}`,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    await carregarContaCorrente();
    mensagem.value = 'Débito realizado com sucesso!';
    tipoMensagem.value = 'success';
    valorDebito.value = 0;
  } catch (error) {
    mensagem.value = error.response?.data?.message || 'Erro ao realizar débito.';
    tipoMensagem.value = 'error';
  }
}

onMounted(carregarContaCorrente);
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
</style>

