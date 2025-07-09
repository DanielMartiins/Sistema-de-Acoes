<template>
  <v-alert v-if="show" type="success" :timeout="timeout">
    <div class="d-flex justify-space-between align-center">
      {{mensagem}}
      <v-progress-circular
        class="ml-4"
        v-if="loading"
        color="primary"
        indeterminate="disable-shrink"
        size="16"
        width="2"
      ></v-progress-circular>
    </div>
  </v-alert>
</template>

<script setup>
defineProps({
  mensagem: {
    type: String,
    required: true,
  },
  show: {
    type: Boolean,
    default: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  timeout: {
    type: [Number, String],
    default: 3000, // tempo em ms
  },
});
</script>
