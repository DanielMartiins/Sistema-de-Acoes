<template>
  <v-app>
    <NavegadorSidebar v-if="!esconderComponentes.includes(route.path)"></NavegadorSidebar>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { watchEffect } from 'vue';
import { useAuth } from './composables/useAuth';
import { useRouter } from 'vue-router';
import { useRoute } from 'vue-router';
import NavegadorSidebar from './components/NavegadorSidebar.vue';

const esconderComponentes = ['/login', '/cadastro']
const router = useRouter();
const route = useRoute();
const { logout, token, isTokenExpired } = useAuth();

watchEffect(() => {

  //Se usuário está logado mas seu token expirou, deslogar
  if (token.value && isTokenExpired.value) {
    logout();
    router.push({name: 'login'})
  }
});
</script>

<style>
  .v-overlay__scrim {
    background-color: rgba(0,0,0) !important;
  }
</style>
