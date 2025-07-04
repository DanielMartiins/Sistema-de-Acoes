import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import { loadFonts } from './plugins/webfontloader';
import { ref } from 'vue'

loadFonts();
const app = createApp(App);

app.config.globalProperties.credentials = ref(null);
app.config.globalProperties.config = {
    url: 'http://192.168.254.55:3000' //URL do Back-end
};

app.use(router).use(vuetify).mount('#app');
