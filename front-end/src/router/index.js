import { createRouter, createWebHistory } from 'vue-router';
import PaginaInicial from '@/views/PaginaInicial.vue';
import CriacaoConta from '@/views/usuario/cadastro/CriacaoConta.vue';
import FormLogin from '@/views/usuario/login/FormLogin.vue';
import { token } from '@/composables/useAuth.js';

const routes = [
  {
    path: '/',
    name: 'pagina-inicial',
    component: PaginaInicial,
    beforeEnter: (to, from, next) => {
      if (!token) {
        next({ name: 'login' });
      }
    },
  },
  {
    path: '/login',
    name: 'login',
    component: FormLogin,
  },
  {
    path: '/cadastro',
    name: 'cadastro',
    component: CriacaoConta,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
