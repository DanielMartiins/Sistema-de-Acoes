<template>
    <v-app>
        <!-- WRAPPER para centralizar -->
        <div class="d-flex justify-center align-center" style="height: 100vh">
            <v-container class="rounded-xl" :width="400" style="background-color: #212121">
                <h2 class="text-h5 text-center mb-4">Login</h2>
                <v-form>
                    <v-text-field label="Email" v-model="form.email"></v-text-field>
                    <v-text-field label="Senha" v-model="form.senha"></v-text-field>

                    <div class="d-flex align-center justify-sm-space-between">
                        <v-btn color="indigo-darken-2" @click="processarLogin">Entrar</v-btn>

                        <div
                            class="text-error"
                            v-if="loginBemSucedido === false && !falhaNoServidor"
                        >
                            Email ou senha incorretos
                        </div>
                        <div class="text-error" v-if="falhaNoServidor === true">
                            Ocorreu um erro no servidor
                        </div>
                    </div>
                </v-form>
            </v-container>
        </div>

        <v-dialog v-model="loginBemSucedido" location="center" persistent width="320">
            <v-card title="Login Bem Sucedido">
                <v-card-text>Login realizado com sucesso!</v-card-text>
                <v-card-actions>
                    <v-btn @click="loginBemSucedido = null">Fechar</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-app>
</template>

<script setup>
import { ref, getCurrentInstance } from 'vue';
import axios from 'axios';

const { appContext } = getCurrentInstance();
const credentials = appContext.config.globalProperties.credentials;
const config = appContext.config.globalProperties.config;

const form = ref({
    email: 'danieldemoraiis@gmail.com',
    senha: 'teste123',
});
const loginBemSucedido = ref(null);
const falhaNoServidor = ref(false);
function processarLogin() {
    let error = '';
    axios
        .post(
            `${config.url}/usuario/login`,
            {
                email: form.value.email,
                senha: form.value.senha,
            },
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        )
        .then((response) => {
            credentials.value = response.data.token;
            loginBemSucedido.value = true;
            falhaNoServidor.value = false;
        })
        .catch((err) => {
            console.log(err.response);
            error = err;
            loginBemSucedido.value = false;
            if (err.response.status === 500) falhaNoServidor.value = true;
            else falhaNoServidor.value = false;
        });
}
</script>
