<template>
  <div class="text-button text-center">
    <v-btn class="bg-secondary" @click="router.push({ name: 'pagina-inicial' })">
      <v-icon>mdi-home</v-icon>
      Página inicial
    </v-btn>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
const router = useRouter();
</script>
