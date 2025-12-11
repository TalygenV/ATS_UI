import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import 'bootstrap/dist/css/bootstrap.min.css';
//import '../src/config/tabler-icons.min.css'
//import '../src/config/style.css'


createApp(App).use(router).mount('#app');