
import VueGoogleMaps from 'vue3-google-maps';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/styles/main.css';

const app = createApp(App);

app.use(VueGoogleMaps, {
  load: {
    key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY, // google map API key
    libraries: 'places', 
  },
});

app.mount('#app');
