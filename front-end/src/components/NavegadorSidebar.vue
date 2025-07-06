<template>
  <v-layout>
    <v-navigation-drawer expand-on-hover rail permanent>
      <v-list>
        <v-list-item prepend-icon="mdi-account" :subtitle="user.email"></v-list-item>
      </v-list>

      <v-divider />

      <v-list density="compact" nav>
        <v-list-item prepend-icon="mdi-folder" title="My Files" value="myfiles"></v-list-item>
        <v-list-item
          prepend-icon="mdi-account-multiple"
          title="Shared with me"
          value="shared"
        ></v-list-item>
        <v-list-item prepend-icon="mdi-star" title="Starred" value="starred"></v-list-item>
      </v-list>
    </v-navigation-drawer>
  </v-layout>
</template>

<script setup>
  import { useAuth } from '@/composables/useAuth';

  const { user } = useAuth();
</script>
