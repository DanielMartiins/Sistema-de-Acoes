<template>
  <v-app>
    <v-container class="fill-height d-flex flex-column justify-center align-center text-center">
      <h1 class="text-h3 font-weight-bold mb-4">Sistema de Ações</h1>

      <template v-if="!isAutenticado">
        <p class="text-subtitle-1 mb-6">Simule negociações com ações de forma simples e segura.</p>

        <div class="d-flex flex-column align-center">
          <router-link :to="{ name: 'login' }">
            <v-btn class="mb-3" color="primary" large>Entrar</v-btn>
          </router-link>
          <router-link :to="{ name: 'cadastro' }">
            <v-btn class="mb-3" color="secondary" large>Criar Conta</v-btn>
          </router-link>
        </div>
      </template>

      <template v-else>
        <p class="text-subtitle-1 mb-6">Bem-vindo de volta!</p>

        <v-btn class="mb-3" color="primary" large @click="irParaDashboard">
          Ir para o painel
        </v-btn>
        <v-btn color="error" @click="logout">Sair</v-btn>
      </template>

      <v-img
        src="https://cdn-icons-png.flaticon.com/512/263/263115.png"
        alt="ícone ações"
        width="100"
        class="mt-6"
      />
    </v-container>
  </v-app>
</template>

<script setup>
import { getCurrentInstance, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { appContext } = getCurrentInstance()
const credentials = appContext.config.globalProperties.credentials

const isAutenticado = computed(() => !!credentials.value)

function irParaDashboard() {
  router.push({ name: 'dashboard' }) // ajuste para a página real do sistema
}

function logout() {
  credentials.value = null
  router.push({ name: 'home' })
}
</script>
