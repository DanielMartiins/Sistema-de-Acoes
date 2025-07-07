<template>
  <v-alert
    v-if="show"
    type="error"
    :text="mensagem"
    :timeout="timeout"
  ></v-alert>
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
  timeout: {
    type: [Number, String],
    default: 3000, // tempo em ms
  },
});
</script>
