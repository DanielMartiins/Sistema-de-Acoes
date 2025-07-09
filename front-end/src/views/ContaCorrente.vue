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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { config } from '@/config';

const saldo = ref(0); // Inicial, pode carregar via API depois
const valorDeposito = ref(0);
const mensagem = ref('');
const tipoMensagem = ref('success'); // success, error, info...

async function retornaSaldoAtual() {
  const response = await axios.get(`${config.apiUrl}/contaCorrente`, {
    headers: {
      Authorization: `Bearer: ${localStorage.getItem('token')}`
    },
  });
  const saldo = response.data.saldo;
  return saldo;
}

async function fazerDeposito() {
  if (valorDeposito.value <= 0) {
    mensagem.value = 'Informe um valor válido para depósito.';
    tipoMensagem.value = 'error';
    return;
  }

  try {
    // Exemplo de requisição POST para depositar
    const response = await axios.post(`${config.apiUrl}/contaCorrente/depositar`, {
      valor: valorDeposito.value,
      descricao: `Deposito de R$ ${valorDeposito.value}`
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      }
    });

    // Atualiza saldo com resposta (supondo que a API retorne o saldo atualizado)
    saldo.value = await retornaSaldoAtual();

    mensagem.value = 'Depósito realizado com sucesso!';
    tipoMensagem.value = 'success';
    valorDeposito.value = 0;

  } catch (error) {
    mensagem.value = error.response?.data?.message || 'Erro ao realizar depósito.';
    tipoMensagem.value = 'error';
  }
}

onMounted(async () => {
  saldo.value = await retornaSaldoAtual();
})
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
