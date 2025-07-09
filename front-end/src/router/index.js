import { createRouter, createWebHistory } from 'vue-router';
import PaginaInicial from '@/views/PaginaInicial.vue';
import CriacaoConta from '@/views/usuario/cadastro/CriacaoConta.vue';
import FormLogin from '@/views/usuario/login/FormLogin.vue';
import { useAuth } from '@/composables/useAuth.js';
import MinhaCarteira from '@/views/MinhaCarteira.vue';
import ContaCorrente from '@/views/ContaCorrente.vue';

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
  path: '/recuperar-senha',
  name: 'recuperar-senha',
  component: () => import('../views/usuario/senha/RecuperarSenha.vue'),
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
  },
  {
  path: '/usuario/senha/recuperar',
  name: 'nova-senha',
  component: () => import('../views/usuario/senha/NovaSenha.vue'),
  },
  {
    path: '/conta-corrente',
    name: 'conta-corrente',
    component: ContaCorrente,
    beforeEnter: (to, from, next) => {
      const { isTokenExpired } = useAuth();
      if (isTokenExpired.value) {
        next({ name: 'login' });
      } else next();
    },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
