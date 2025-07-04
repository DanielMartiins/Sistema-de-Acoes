<template>
  <v-app>
    <!-- WRAPPER para centralizar -->
    <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
      <div>
        <h4 class="text-h4 text-center mb-4">Criar Conta</h4>

        <v-alert
          v-if="cadastroBemSucedido === false"
          type="error"
          class="mb-4"
          title="Erro"
          :text="mensagemErro"
          style="max-width: 400px"
        />
        <v-alert
          v-if="cadastroBemSucedido === true"
          type="success"
          class="mb-4"
          style="max-width: 400px"
        >
          <div class="d-flex justify-space-between align-center">
            Login realizado com sucesso
            <v-progress-circular
              color="primary"
              indeterminate="disable-shrink"
              size="16"
              width="2"
            ></v-progress-circular>
          </div>
        </v-alert>

        <v-container class="rounded-lg" :width="400" style="background-color: #212121">
          <v-form ref="formRef">
            <v-text-field
              class="mb-3"
              label="Email"
              v-model="form.email"
              hint="Exemplo: pessoa@gmail.com"
              persistent-hint
              :rules="[
                () => !!form.email || 'Campo obrigatório',
                () => (!!form.email && verificaEmailValido(form.email)) || 'Email inválido',
              ]"
            ></v-text-field>
            <v-text-field
              class="mb-3"
              label="Senha"
              v-model="form.senha"
              hint="Mínimo de 8 caracteres, contendo letra e número"
              persistent-hint
              :rules="[() => !!form.senha || 'Campo obrigatório']"
            ></v-text-field>
            <v-text-field
              class="mb-3"
              label="Senha Repetida"
              v-model="form.senhaRepetida"
              :rules="[
                () => !!form.senhaRepetida || 'Campo obrigatório',
                () => (!!form.senhaRepetida && senhasCoincidem()) || 'Senhas não coincidem',
              ]"
            ></v-text-field>

            <div class="d-flex align-center justify-space-between">
              <v-btn color="indigo-darken-2" @click="processarCadastro" :disabled="false"
                >Criar Conta</v-btn
              >
              <v-card-text>
                <router-link class="link" href :to="{ name: 'login' }">
                  <a class="btn btn-lg btn-success" href="" role="button">Login</a>
                </router-link>
              </v-card-text>
            </div>
          </v-form>
        </v-container>
      </div>
    </div>
  </v-app>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { ref, getCurrentInstance } from 'vue';
import axios from 'axios';

const router = useRouter();
const { appContext } = getCurrentInstance();
const config = appContext.config.globalProperties.config;

const formRef = ref(null);
const formularioValido = ref(false);
const cadastroBemSucedido = ref(null);
const mensagemErro = ref('');

function senhasCoincidem() {
  return form.value.senha === form.value.senhaRepetida;
}

const form = ref({
  email: '',
  senha: '',
  senhaRepetida: '',
});

function verificaEmailValido(email) {
  if (!email) {
    return false;
  }

  return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,4}$/.test(email);
}

function processarCadastro() {
  axios
    .post(
      `${config.url}/usuario/criarConta`,
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
      cadastroBemSucedido.value = true;
      setTimeout(() => {
        cadastroBemSucedido.value = null;
        router.push({ name: 'home' });
      }, 2000);
      console.log(response.data.message);
    })
    .catch((err) => {
      console.log(err.response);
      mensagemErro.value = err.response.data.message;
      cadastroBemSucedido.value = false;
    });
}
</script>
