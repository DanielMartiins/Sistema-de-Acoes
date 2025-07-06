<template>
  <v-app>
    <!-- WRAPPER para centralizar -->
    <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
      <div>
        <h4 class="text-h4 text-center mb-4">Login</h4>

        <v-alert
          v-if="loginBemSucedido === false"
          type="error"
          class="mb-4"
          :text="mensagemErro"
          timeout="3s"
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
            <v-text-field
              label="Email"
              v-model="form.email"
              :disabled="loginBemSucedido === true"
            ></v-text-field>

            <div class="d-flex">
              <router-link
                class="ml-auto text-decoration-none text-body-2"
                href
                :to="{ name: 'cadastro' }"
              >
                Esqueci minha senha(NÃO IMPLEMENTADO!!!)
              </router-link>
            </div>
            <v-text-field
              label="Senha"
              v-model="form.senha"
              :disabled="loginBemSucedido === true"
            ></v-text-field>

            <div class="d-flex flex-column align-center">
              <v-btn
                :loading="processandoLogin"
                :disabled="!validarFormulario() || loginBemSucedido === true"
                :class="[
                  'w-100 mb-5',
                  { 'opacity-30 bg-primary': !validarFormulario() },
                  { 'opacity-100 bg-primary': validarFormulario() },
                ]"
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
import { config } from '@/config';
import { useRouter } from 'vue-router';
import { watch } from 'vue';
import { ref, getCurrentInstance } from 'vue';
import axios from 'axios';
import { useAuth } from '@/composables/useAuth';

const router = useRouter();

const form = ref({
  email: '',
  senha: '',
});
const loginBemSucedido = ref(null);
const processandoLogin = ref(false);
const mensagemErro = ref('Ocorreu um erro no servidor');

function validarFormulario() {
  return form.value.email.length >= 1 && form.value.senha.length >= 1;
}

function processarLogin() {
  processandoLogin.value = true;
  axios
    .post(
      `${config.apiUrl}/usuario/login`,
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
      processandoLogin.value = false;
      loginBemSucedido.value = true;
      const { setToken } = useAuth();
      setToken(response.data.token);
      setTimeout(() => {
        loginBemSucedido.value = null;
        router.push({ name: 'pagina-inicial' });
      }, 2000);
    })
    .catch((err) => {
      processandoLogin.value = false;
      loginBemSucedido.value = false;
      if (err.response) mensagemErro.value = err.response.data.message;
      console.log(err.response);
    });
}

watch(
  form,
  () => {
    //Para limpar mensagens de feedback quando o usuário alterar algum campo do formulário
    loginBemSucedido.value = null;
  },
  { deep: true },
);
</script>
