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
            Conta criada com sucesso!
            <router-link class="link" href :to="{ name: 'login' }">
              <v-btn class="bg-secondary">Entrar</v-btn>
            </router-link>
          </div>
        </v-alert>

        <v-container class="rounded-lg bg-secondary" :width="400">
          <v-form>
            <v-text-field
              class="mb-3"
              label="Email"
              v-model="form.email"
              hint="Exemplo: pessoa@gmail.com"
              persistent-hint
              :rules="[
                () => !!form.email || 'Campo obrigatório',
                () => (!!form.email && verificaEmailValido(form.email)) || 'Formato incompleto',
              ]"
            ></v-text-field>
            <v-text-field
              class="mb-3"
              label="Senha"
              v-model="form.senha"
              hint="Mínimo de 8 caracteres, contendo letra e número"
              persistent-hint
              :rules="[
                () => !!form.senha || 'Campo obrigatório',
                () =>
                  (!!form.senha && verificaSenhaValida(form.senha)) ||
                  'Mínimo de 8 caracteres, contendo letra e número',
              ]"
            >
            </v-text-field>
            <v-text-field
              class="mb-3"
              label="Senha Repetida"
              v-model="form.senhaRepetida"
              :rules="[
                () => !!form.senhaRepetida || 'Campo obrigatório',
                () => (!!form.senhaRepetida && senhasCoincidem()) || 'Senhas não coincidem',
              ]"
            ></v-text-field>

            <div class="d-flex flex-column align-center">
              <v-btn
                :disabled="!validarFormulario()"
                class="w-100 mb-5"
                color="indigo-darken-2"
                @click="processarCadastro"
              >
                Criar Conta
              </v-btn>
              <v-card-text>
                <router-link class="link" href :to="{ name: 'login' }">
                  Já tenho uma conta
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
import { watch } from 'vue';
import { ref, getCurrentInstance } from 'vue';
import axios from 'axios';

const { appContext } = getCurrentInstance();
const config = appContext.config.globalProperties.config;

const formularioValido = ref(false);
const cadastroBemSucedido = ref(null);
const mensagemErro = ref('');

const form = ref({
  email: '',
  senha: '',
  senhaRepetida: '',
});

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
      console.log(response.data.message);
    })
    .catch((err) => {
      console.log(err.response);
      mensagemErro.value = err.response.data.message;
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
    formularioValido.value = false;
  },
  { deep: true },
);
</script>
