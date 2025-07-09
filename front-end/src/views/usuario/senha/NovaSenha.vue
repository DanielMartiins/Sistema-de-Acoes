<template>
  <v-app>
    <div class="d-flex flex-column justify-center align-center" style="height: 100vh">
      <div class="text-align text-center">
        <BotaoHome class="bg-secondary" />
      </div>

      <h4 class="text-h4 text-center mt-3 mb-2">Criar Nova Senha</h4>

      <MensagemErro
        class="mb-2"
        :mensagem="mensagemErro"
        :show="status === 'erro'"
        :width="400"
      />

      <MensagemSucesso
        class="mb-2"
        :mensagem="mensagemSucesso"
        :show="status === 'sucesso'"
        :width="400"
      />

      <v-container class="rounded-lg bg-secondary" :width="400">
        <v-form>
          <v-text-field
            class="mb-4"
            label="Nova Senha"
            :type="mostrarSenha ? 'text' : 'password'"
            v-model="novaSenha"
            :append-inner-icon="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="mostrarSenha = !mostrarSenha"
          />

          <v-text-field
            class="mb-4"
            label="Confirmar Nova Senha"
            :type="mostrarSenha ? 'text' : 'password'"
            v-model="confirmarSenha"
            :append-inner-icon="mostrarSenha ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="mostrarSenha = !mostrarSenha"
          />

          <div class="d-flex flex-column align-center">
            <v-btn
              class="w-100"
              color="primary"
              :loading="enviando"
              :disabled="!formValido"
              @click="enviarNovaSenha"
            >
              Confirmar nova senha
            </v-btn>

            <v-card-text>
              <router-link
                class="text-primary text-button text-decoration-none hover-link"
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import { config } from '@/config'
import BotaoHome from '@/components/BotaoHome.vue'
import MensagemErro from '@/components/MensagemErro.vue'
import MensagemSucesso from '@/components/MensagemSucesso.vue'

const route = useRoute()
const email = ref('')
const token = ref('')
const novaSenha = ref('')
const confirmarSenha = ref('')
const mostrarSenha = ref(false)

const mensagemErro = ref('')
const mensagemSucesso = ref('Senha redefinida com sucesso!')
const status = ref(null) // 'erro' | 'sucesso' | null
const enviando = ref(false)

const formValido = computed(() => {
  return (
    novaSenha.value.length >= 8 &&
    novaSenha.value === confirmarSenha.value &&
    /[a-zA-Z]/.test(novaSenha.value) &&
    /[0-9]/.test(novaSenha.value)
  )
})

onMounted(() => {
  email.value = route.query.email || ''
  token.value = route.query.token || ''

  if (!email.value || !token.value) {
    status.value = 'erro'
    mensagemErro.value = 'Token ou e-mail ausente ou inválido.'
  }
})

function enviarNovaSenha() {
  if (!formValido.value) return

  enviando.value = true
  axios
    .post(
      `${config.apiUrl}/usuario/senha/recuperar?email=${encodeURIComponent(
        email.value
      )}&token=${token.value}`,
      { novaSenha: novaSenha.value }
    )
    .then(() => {
      status.value = 'sucesso'
    })
    .catch((err) => {
      console.error(err)
      status.value = 'erro'
      mensagemErro.value = err.response?.data?.message || 'Erro ao redefinir senha.'
    })
    .finally(() => {
      enviando.value = false
    })
}
</script>

<style scoped>
.hover-link:hover {
  filter: brightness(1.25);
}
</style>
