<template>
  <NavegadorSidebar />
  <v-container class="bg-surface-variant mb-6">
    <v-row align="start" style="height: 150px" no-gutters>
      <v-col v-for="n in 3" :key="n">
        <v-sheet class="pa-2 ma-2"> .align-start </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// Components
import NavegadorSidebar from '@/components/NavegadorSidebar.vue';
</script>
