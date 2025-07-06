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
  if (token.value && isTokenExpired.value) {
    logout();
    router.push({name: 'pagina-inicial'})
  }
});
</script>
