import { createRouter, createWebHistory } from 'vue-router';
import PaginaInicial from '../components/PaginaInicial.vue';

const routes = [
    {
        path: '/',
        name: 'home',
        component: PaginaInicial,
    },
    {
        path: '/about',
        name: 'about',
        component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue'),
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('../components/usuario/login/FormLogin.vue'),
    },
    {
        path: '/cadastro',
        name: 'cadastro',
        component: () => import('../components/usuario/cadastro/CriacaoConta.vue'),
    },
    {
        path: '/dashboard',
        name: 'dashboard',
        component: () => import('../components/DashboardUsuario.vue'),
    },
];

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
});

export default router;
