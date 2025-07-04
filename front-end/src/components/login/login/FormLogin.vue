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
          title="Login realizado com sucesso"
          style="max-width: 400px"
        />

        <v-container class="rounded-lg" :width="400" style="background-color: #212121">
          <v-form>
            <v-text-field label="Email" v-model="form.email"></v-text-field>
            <v-text-field label="Senha" v-model="form.senha"></v-text-field>

            <div class="d-flex align-center justify-sm-space-between">
              <v-btn color="indigo-darken-2" @click="processarLogin">Entrar</v-btn>
            </div>
          </v-form>
        </v-container>
      </div>
    </div>
  </v-app>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue';
import axios from 'axios';

const { appContext } = getCurrentInstance();
const credentials = appContext.config.globalProperties.credentials;
const config = appContext.config.globalProperties.config;

const form = ref({
  email: 'danieldemoraiis@gmail.com',
  senha: 'teste123',
});
const loginBemSucedido = ref(null);
const falhaNoServidor = ref(false);
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
    })
    .catch((err) => {
      console.log(err.response);
      loginBemSucedido.value = false;
      if (!err.response || err.response.status === 500) falhaNoServidor.value = true;
      else falhaNoServidor.value = false;
    });
}
</script>
