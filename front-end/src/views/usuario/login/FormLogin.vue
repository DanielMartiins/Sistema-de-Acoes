<template>
  <!-- WRAPPER para centralizar -->
  <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
    <div class="text-align text-center">
      <BotaoHome class="bg-secondary" />
    </div>

    <h4 class="text-h4 text-center mt-3 mb-2">Login</h4>

    <div>
      <MensagemErro
        class="mb-2"
        :width="400"
        :mensagem="mensagemErro"
        :show="loginBemSucedido === false"
      />
    </div>

    <div>
      <MensagemSucesso
        class="mb-2"
        :width="400"
        mensagem="Login bem sucedido!"
        :show="loginBemSucedido === true"
        :loading="true"
      />
    </div>

    <v-container class="rounded-lg bg-secondary" :width="400">
      <v-form>
        <v-text-field
          label="Email"
          v-model="form.email"
          :rules="[() => form.email.length > 0 || 'Campo obrigatório']"
          :disabled="loginBemSucedido === true"
        ></v-text-field>

        <div class="d-flex justify-end mb-1">
          <router-link
            class="text-decoration-none text-primary text-caption hover-link"
            href
            :to="{ name: 'cadastro' }"
          >
            Esqueci minha senha
          </router-link>
        </div>
        <v-text-field
          class="mb-4"
          label="Senha"
          :type="mostraSenha ? 'text' : 'password'"
          v-model="form.senha"
          :append-inner-icon="mostraSenha ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="mostraSenha = !mostraSenha"
          :disabled="loginBemSucedido === true"
          :rules="[() => form.senha.length > 0 || 'Campo obrigatório']"
        ></v-text-field>

        <div class="d-flex flex-column align-center">
          <v-btn
            :loading="processandoLogin"
            :disabled="!validarFormulario() || loginBemSucedido === true"
            :class="[
              'w-100',
              { 'opacity-30 text-grey-lighten': !validarFormulario() },
              { 'opacity-100 bg-primary': validarFormulario() },
            ]"
            @click="processarLogin()"
          >
            Entrar
          </v-btn>
          <v-card-text>
            <router-link
              class="text-primary text-button text-decoration-none hover-link"
              href
              :to="{ name: 'cadastro' }"
            >
              Não tenho conta
            </router-link>
          </v-card-text>
        </div>
      </v-form>
    </v-container>
  </div>
</template>

<script setup>
import { config } from '@/config';
import { useRouter } from 'vue-router';
import { watch } from 'vue';
import { ref, getCurrentInstance } from 'vue';
import axios from 'axios';
import { useAuth } from '@/composables/useAuth';
import BotaoHome from '@/components/BotaoHome.vue';
import MensagemErro from '@/components/MensagemErro.vue';
import MensagemSucesso from '@/components/MensagemSucesso.vue';

const router = useRouter();

const form = ref({
  email: '',
  senha: '',
});
const loginBemSucedido = ref(null);
const processandoLogin = ref(false);
const mensagemErro = ref('Ocorreu um erro no servidor');
const mostraSenha = ref(false);

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

<style scoped>
.hover-link:hover {
  filter: brightness(1.25);
}
</style>
