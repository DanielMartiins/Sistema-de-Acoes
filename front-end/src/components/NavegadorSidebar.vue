<template>
  <v-navigation-drawer class="bg-secundary" expand-on-hover rail permanent>
    <v-expansion-panels elevation="0" class="mt-2 mb-2">
      <v-expansion-panel>
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
        @click="router.push({ name: 'pagina-inicial' })"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth';
import { useRouter } from 'vue-router';

const { user, logout } = useAuth();
const router = useRouter();

function handleLogout() {
  logout();
  router.push({ name: 'login' });
}
</script>
