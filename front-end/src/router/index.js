import { createRouter, createWebHistory } from 'vue-router';
import PaginaInicial from '@/views/PaginaInicial.vue';
import CriacaoConta from '@/views/usuario/cadastro/CriacaoConta.vue';
import FormLogin from '@/views/usuario/login/FormLogin.vue';
import { useAuth } from '@/composables/useAuth.js';
import MinhaCarteira from '@/views/MinhaCarteira.vue';

const routes = [
  {
    path: '/',
    name: 'pagina-inicial',
    component: PaginaInicial,
    beforeEnter: (to, from, next) => {
      const { isTokenExpired } = useAuth();
      if (isTokenExpired.value) {
        next({ name: 'login' });
      } else next();
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
  {
    path: '/carteira',
    name: 'carteira',
    component: MinhaCarteira,
    beforeEnter: (to, from, next) => {
      const { isTokenExpired } = useAuth();
      if (isTokenExpired.value) {
        next({ name: 'login' });
      } else next();
    },
  }

];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
