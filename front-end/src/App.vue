<template>
  <v-app>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { watchEffect } from 'vue';
import { useAuth } from './composables/useAuth';
import { useRouter } from 'vue-router';

const router = useRouter();
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
