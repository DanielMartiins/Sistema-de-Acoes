<template>
  <v-btn @click="router.push({ name: 'pagina-inicial' })">
    <v-icon>mdi-home</v-icon>
    Página inicial
  </v-btn>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>
