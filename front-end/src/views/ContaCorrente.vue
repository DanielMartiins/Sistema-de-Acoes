<template>
  <div class="tabela-wrapper">
    <v-sheet class="pa-10" style="max-width: 400px; width: 100%">
      <p>Saldo: R$ {{ saldo }}</p>

      <v-text-field
        label="Valor do Depósito"
        v-model="valorDeposito"
        type="number"
        prefix="R$ "
        dense
        outlined
      />

      <v-btn color="primary" class="mt-4" @click="fazerDeposito" :disabled="valorDeposito <= 0">
        Depositar
      </v-btn>

      <v-text-field
        label="Valor do Débito"
        v-model="valorDebito"
        type="number"
        prefix="R$ "
        dense
        outlined
        class="mt-4"
      />

      <v-btn color="error" class="mt-2" @click="fazerDebito" :disabled="valorDebito <= 0">
        Debitar
      </v-btn>

      <v-alert
        v-if="mensagem"
        :type="tipoMensagem"
        class="mt-4"
        dense
        border="left"
        prominent
      >
        {{ mensagem }}
      </v-alert>
    </v-sheet>

    <!-- Container de lançamentos scrollável -->
    <v-sheet class="lancamentos-wrapper mt-6" max-width="600" width="100%">
      <h4 class="text-h6 mb-3">Lançamentos da Conta Corrente</h4>
      <div class="lancamentos-scroll">
        <v-list dense>
          <v-list-item v-for="(item, index) in lancamentos" :key="index">
            <v-list-item-content>
              <v-list-item-title>
                <span :class="item.valor > 0 ? 'text-success' : 'text-error'">
                  {{ item.valor > 0 ? '+' : '' }}R$ {{ item.valor.toFixed(2) }}
                </span>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ item.data_hora }} — {{ item.historico.descricao }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
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

async function retornaSaldoAtual() {
  const response = await axios.get(`${config.apiUrl}/contaCorrente`, {
    headers: {
      Authorization: `Bearer: ${localStorage.getItem('token')}`
    },
  });
  saldo.value = response.data.saldo;
  lancamentos.value = response.data.lancamentos.map(l => ({
    ...l,

  }));
}

async function fazerDeposito() {
  if (valorDeposito.value <= 0) {
    mensagem.value = 'Informe um valor válido para depósito.';
    tipoMensagem.value = 'error';
    return;
  }

  try {
    await axios.post(`${config.apiUrl}/contaCorrente/depositar`, {
      valor: valorDeposito.value,
      descricao: `Depósito de R$ ${valorDeposito.value}`
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    });

    await retornaSaldoAtual();
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
    await axios.post(`${config.apiUrl}/contaCorrente/debitar`, {
      valor: valorDebito.value,
      descricao: `Débito de R$ ${valorDebito.value}`
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    });

    await retornaSaldoAtual();
    mensagem.value = 'Débito realizado com sucesso!';
    tipoMensagem.value = 'success';
    valorDebito.value = 0;

  } catch (error) {
    mensagem.value = error.response?.data?.message || 'Erro ao realizar débito.';
    tipoMensagem.value = 'error';
  }
}

onMounted(() => {
  retornaSaldoAtual();
});
</script>

<style scoped>
.tabela-wrapper {
  min-height: 100vh;
  padding: 2rem 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.lancamentos-wrapper {
  max-height: 300px;
  overflow: hidden;
  border: 1px solid #ccc;
  border-radius: 8px;
}

.lancamentos-scroll {
  max-height: 240px;
  overflow-y: auto;
  padding: 1rem;
}
</style>