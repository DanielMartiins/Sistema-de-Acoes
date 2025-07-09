<template>
  <v-app>
    <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
      <div class="text-align text-center">
        <BotaoHome class="bg-secondary" />
      </div>

      <h4 class="text-h4 text-center mt-3 mb-2">Recuperar Senha</h4>

      <div>
        <MensagemErro
          class="mb-2"
          :width="400"
          :mensagem="mensagemErro"
          :show="statusEnvio === 'erro'"
        />
      </div>

      <div>
        <MensagemSucesso
          class="mb-2"
          :width="400"
          :mensagem="mensagemSucesso"
          :show="statusEnvio === 'sucesso'"
        />
      </div>

      <v-container class="rounded-lg bg-secondary" :width="400">
        <v-form>
          <v-text-field
            class="mb-4"
            label="Email"
            v-model="email"
            :rules="[() => email.length > 0 || 'Campo obrigatório']"
            :disabled="statusEnvio === 'sucesso'"
          ></v-text-field>

          <div class="d-flex flex-column align-center">
            <v-btn
              :disabled="email.length === 0 || statusEnvio === 'sucesso'"
              :loading="enviando"
              @click="enviarToken"
              class="w-100"
              color="primary"
            >
              Enviar link de recuperação
            </v-btn>
            <v-card-text>
              <router-link
                class="text-decoration-none text-primary text-button hover-link"
                :to="{ name: 'login' }"
              >
                Voltar ao login
              </router-link>
            </v-card-text>
          </div>
        </v-form>
      </v-container>
    </div>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { config } from '@/config'
import BotaoHome from '@/components/BotaoHome.vue'
import MensagemErro from '@/components/MensagemErro.vue'
import MensagemSucesso from '@/components/MensagemSucesso.vue'

const email = ref('')
const mensagemErro = ref('Erro ao enviar link de recuperação.')
const mensagemSucesso = ref('Um link de recuperação foi enviado para seu e-mail.')
const statusEnvio = ref(null) // 'sucesso' | 'erro' | null
const enviando = ref(false)

function enviarToken() {
  if (!email.value || !verificaEmailValido(email.value)) {
    mensagemErro.value = 'Formato de e-mail inválido.'
    statusEnvio.value = 'erro'
    return
  }

  enviando.value = true
  axios
    .post(`${config.apiUrl}/usuario/senha/token`, { email: email.value })
    .then(() => {
      statusEnvio.value = 'sucesso'
    })
    .catch((err) => {
      console.error(err)
      statusEnvio.value = 'erro'
      mensagemErro.value = err.response?.data?.message || 'Erro ao enviar e-mail.'
    })
    .finally(() => {
      enviando.value = false
    })
}

function verificaEmailValido(email) {
  return /^[A-Za-z0-9._%-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,4}$/.test(email)
}
</script>

<style scoped>
.hover-link:hover {
  filter: brightness(1.25);
}
</style>
