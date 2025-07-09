<template>
  <v-navigation-drawer class="bg-secondary" expand-on-hover rail permanent>
    <v-expansion-panels elevation="0" class="mt-2 mb-2">
      <v-expansion-panel class="bg-secondary">
        <v-expansion-panel-title class="pa-0">
          <v-list-item density="compact" class="pe-2" style="height: 48px">
            <template #prepend>
              <v-icon>mdi-account</v-icon>
            </template>

            <div v-if="user" style="white-space: nowrap; text-overflow: ellipsis">
              <v-list-item-title>Minha Conta</v-list-item-title>
              <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
            </div>
          </v-list-item>
        </v-expansion-panel-title>
        <v-expansion-panel-text class="pa-0">
          <v-list density="compact" nav class="pa-0">
            <v-list-item
              @click="handleLogout"
              title="Sair"
              prepend-icon="mdi-logout"
              value="logout"
            ></v-list-item>
            <v-list-item
               @click="abrirDialogoTrocaSenha"
               title="Trocar senha"
               prepend-icon="mdi-lock-reset"
               value="trocarSenha"
              />
          </v-list>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-divider />

    <v-list density="compact" nav>
      <v-list-item
        prepend-icon="mdi-home"
        title="Página inicial"
        value="paginainicial"
        @click="router.push({ name: 'pagina-inicial' })"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-wallet-bifold"
        title="Minha carteira"
        value="minhacarteira"
        @click="router.push({ name: 'carteira' })"
      ></v-list-item>
      <v-list-item
        prepend-icon="mdi-cash"
        title="Conta corrente"
        value="contacorrente"
        @click="router.push({ name: 'conta-corrente' })"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
  <v-dialog v-model="dialogoTrocarSenha" max-width="500">
  <v-card rounded="lg" elevation="12">
    <v-card-title class="text-h6">Alterar senha</v-card-title>
    <v-card-text>
      <v-form>
       <v-text-field
          v-model="senhaAtual"
          :type="mostrarSenhaAtual ? 'text' : 'password'"
          label="Senha atual"
          class="mb-3"
          :append-inner-icon="mostrarSenhaAtual ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="mostrarSenhaAtual = !mostrarSenhaAtual"
        />
        <v-text-field
          v-model="novaSenha"
          :type="mostrarNovaSenha ? 'text' : 'password'"
          label="Nova senha"
          class="mb-3"
          hint="Mínimo de 8 caracteres, letras e números"
          persistent-hint
          :append-inner-icon="mostrarNovaSenha ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="mostrarNovaSenha = !mostrarNovaSenha"
        />
        <v-text-field
          v-model="novaSenhaConfirmada"
          :type="mostrarNovaSenhaConfirmada ? 'text' : 'password'"
          label="Confirmar nova senha"
          :append-inner-icon="mostrarNovaSenhaConfirmada ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="mostrarNovaSenhaConfirmada = !mostrarNovaSenhaConfirmada"
        />
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="dialogoTrocarSenha = false">Cancelar</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :disabled="!formTrocaSenhaValido"
        @click="trocarSenha"
      >
        Confirmar
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

</template>

<script setup>
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { ref, computed } from 'vue';
import { config } from '@/config';

const { user, logout } = useAuth();
const router = useRouter();
const dialogoTrocarSenha = ref(false);
const senhaAtual = ref('');
const novaSenha = ref('');
const novaSenhaConfirmada = ref('');
const mostrarSenhaAtual = ref(false);
const mostrarNovaSenha = ref(false);
const mostrarNovaSenhaConfirmada = ref(false);


function abrirDialogoTrocaSenha() {
  dialogoTrocarSenha.value = true;
}

const formTrocaSenhaValido = computed(() => {
  return (
    senhaAtual.value &&
    novaSenha.value &&
    novaSenhaConfirmada.value &&
    novaSenha.value === novaSenhaConfirmada.value &&
    novaSenha.value.length >= 8 &&
    /[a-zA-Z]/.test(novaSenha.value) &&
    /[0-9]/.test(novaSenha.value)
  );
});

async function trocarSenha() {
  try {
    await axios.put(
      `${config.apiUrl}/usuario/senha`,
      {
        senhaAtual: senhaAtual.value,
        novaSenha: novaSenha.value,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    dialogoTrocarSenha.value = false;
    senhaAtual.value = '';
    novaSenha.value = '';
    novaSenhaConfirmada.value = '';
    alert('Senha alterada com sucesso!');
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || 'Erro ao trocar senha.');
  }
}

function handleLogout() {
  logout();
  router.push({ name: 'login' });
}
</script>
