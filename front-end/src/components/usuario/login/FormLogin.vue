<template>
  <v-app>
    <!-- WRAPPER para centralizar -->
    <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
      <div>
        <h4 class="text-h4 text-center mb-4">Login</h4>

        <v-alert
          v-if="loginBemSucedido === false && falhaNoServidor === false"
          type="error"
          class="mb-4"
          title="Email ou senha inválidos"
          timeout="3s"
          style="max-width: 400px"
        />
        <v-alert
          v-if="falhaNoServidor === true"
          type="error"
          class="mb-4"
          title="Ocorreu um erro no servidor"
          style="max-width: 400px"
        />

        <v-alert
          v-if="loginBemSucedido === true"
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

        <v-container class="rounded-lg bg-secondary" :width="400">
          <v-form>
            <v-text-field label="Email" v-model="form.email"></v-text-field>

            <v-card-text class="d-flex">
              <router-link
                class="ml-auto text-decoration-none text-body-2"
                href
                :to="{ name: 'cadastro' }"
              >
                Esqueci minha senha(NÃO IMPLEMENTADO!!!)
              </router-link>
            </v-card-text>
            <v-text-field label="Senha" v-model="form.senha"></v-text-field>

            <div class="d-flex flex-column align-center">
              <v-btn
                :disabled="!validarFormulario()"
                class="w-100 mb-5 bg-primary"
                @click="processarLogin"
              >
                Entrar
              </v-btn>
              <v-card-text>
                <router-link href :to="{ name: 'cadastro' }"> Criar nova conta </router-link>
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
const credentials = appContext.config.globalProperties.credentials;
const config = appContext.config.globalProperties.config;

const form = ref({
  email: '',
  senha: '',
});
const loginBemSucedido = ref(null);
const falhaNoServidor = ref(false);

function validarFormulario() {
  return form.value.email.length >= 1 && form.value.senha.length >= 1;
}

function processarLogin() {
  axios
    .post(
      `${config.url}/usuario/login`,
      {
        email: form.value.email,
        senha: form.value.senha,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    )
    .then((response) => {
      credentials.value = response.data.token;
      loginBemSucedido.value = true;
      falhaNoServidor.value = false;
      setTimeout(() => {
        loginBemSucedido.value = null;
        router.push({ name: 'home' });
      }, 2000);
    })
    .catch((err) => {
      console.log(err.response);
      loginBemSucedido.value = false;
      if (!err.response || err.response.status === 500) falhaNoServidor.value = true;
      else falhaNoServidor.value = false;
    });
}
</script>
