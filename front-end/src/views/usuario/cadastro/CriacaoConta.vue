<template>
  <!-- WRAPPER para centralizar -->
  <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
    <div class="text-align text-center">
      <BotaoHome class="bg-secondary" />
    </div>

    <h4 class="text-h4 text-center mt-3 mb-2">Criar Conta</h4>

    <div>
      <MensagemErro
        class="mb-2"
        :width="400"
        :mensagem="mensagemErro"
        :show="cadastroBemSucedido === false"
      />
    </div>

    <div>
      <v-alert
        v-if="cadastroBemSucedido === true"
        type="success"
        class="mb-2"
        style="width: 400px"
      >
        <div class="d-flex justify-space-between align-center">
          Conta criada com sucesso!
          <router-link class="link" href :to="{ name: 'login' }">
            <v-btn class="bg-secondary ml-2">Entrar</v-btn>
          </router-link>
        </div>
      </v-alert>
    </div>

    <v-container class="rounded-lg bg-secondary" :width="400">
      <v-form>
        <v-text-field
          class="mb-4"
          label="Email"
          v-model="form.email"
          hint="Exemplo: pessoa@gmail.com"
          persistent-hint
          :disabled="cadastroBemSucedido === true"
          :rules="[
            () => !!form.email || 'Campo obrigatório',
            () => (!!form.email && verificaEmailValido(form.email)) || 'Formato incompleto',
          ]"
        ></v-text-field>
        <v-text-field
          class="mb-4"
          label="Senha"
          v-model="form.senha"
          hint="Mínimo de 8 caracteres, contendo letra e número"
          persistent-hint
          :disabled="cadastroBemSucedido === true"
          :rules="[
            () => !!form.senha || 'Campo obrigatório',
            () =>
              (!!form.senha && verificaSenhaValida(form.senha)) ||
              'Mínimo de 8 caracteres, contendo letra e número',
          ]"
        >
        </v-text-field>
        <v-text-field
          class="mb-4"
          label="Senha Repetida"
          v-model="form.senhaRepetida"
          :disabled="cadastroBemSucedido === true"
          :rules="[
            () => !!form.senhaRepetida || 'Campo obrigatório',
            () => (!!form.senhaRepetida && senhasCoincidem()) || 'Senhas não coincidem',
          ]"
        ></v-text-field>

        <div class="d-flex flex-column align-center">
          <v-btn
            :disabled="!validarFormulario() || cadastroBemSucedido === true"
            :loading="processandoCadastro"
            :class="[
              'w-100 mb-2',
              { 'opacity-30 text-grey-lighten': !validarFormulario() },
              { 'opacity-100 bg-primary': validarFormulario() },
            ]"
            @click="processarCadastro()"
          >
            Criar Conta
          </v-btn>
          <v-card-text>
            <router-link
              class="text-primary text-button text-decoration-none hover-link"
              href
              :to="{ name: 'login' }"
            >
              Já tenho uma conta
            </router-link>
          </v-card-text>
        </div>
      </v-form>
    </v-container>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { ref } from 'vue';
import axios from 'axios';
import { config } from '@/config';
import { useRouter } from 'vue-router';
import BotaoHome from '@/components/BotaoHome.vue';
import MensagemErro from '@/components/MensagemErro.vue';

const cadastroBemSucedido = ref(null);
const mensagemErro = ref('Ocorreu um erro no servidor.');
const processandoCadastro = ref(false);

const form = ref({
  email: '',
  senha: '',
  senhaRepetida: '',
});

function processarCadastro() {
  processandoCadastro.value = true;
  axios
    .post(
      `${config.apiUrl}/usuario/criarConta`,
      {
        email: form.value.email,
        senha: form.value.senha,
        senhaRepetida: form.value.senhaRepetida,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    .then((response) => {
      processandoCadastro.value = false;
      cadastroBemSucedido.value = true;
      console.log(response.data.message);
    })
    .catch((err) => {
      processandoCadastro.value = false;
      console.log(err.response);
      if (err.response && err.response.data.message) mensagemErro.value = err.response.data.message;
      cadastroBemSucedido.value = false;
    });
}

function verificaEmailValido(email) {
  if (!email) {
    return false;
  }

  return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,4}$/.test(email);
}

function verificaSenhaValida(senha) {
  if (!senha) {
    return false;
  }

  if (senha.length < 8) {
    return false;
  }

  return /.*[a-zA-Z].*$/.test(senha) && /.*[0-9].*$/.test(senha);
}

function senhasCoincidem() {
  return form.value.senha === form.value.senhaRepetida;
}

function validarFormulario() {
  return (
    verificaEmailValido(form.value.email) &&
    verificaSenhaValida(form.value.senha) &&
    senhasCoincidem()
  );
}

watch(
  form,
  () => {
    //Para limpar mensagens de feedback quando o usuário alterar algum campo do formulário
    cadastroBemSucedido.value = null;
  },
  { deep: true },
);
</script>

<style scoped>
.hover-link:hover {
  filter: brightness(1.25);
}
</style>
