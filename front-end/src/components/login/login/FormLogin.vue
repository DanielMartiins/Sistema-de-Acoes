<template>
    <v-container :width="300">
        <v-form>
            <v-text-field label="Email" v-model="form.email"></v-text-field>
            <v-text-field label="Senha" v-model="form.senha"></v-text-field>
            <v-btn>Entrar</v-btn>
        </v-form>
    </v-container>
</template>

<script setup>
    import { ref } from 'vue'

    const form = ref({
        email: "",
        senha: ""
    })
</script>
