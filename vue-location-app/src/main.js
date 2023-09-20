
import VueGoogleMaps from 'vue3-google-maps';
import { createApp } from 'vue';
import App from './App.vue';

const app = createApp(App);

app.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyC7b_FFioyoYpoJ-laEfmEHwY7eMAMxJiU', // Replace with your API key
    libraries: 'places', // necessary for places input
  },
});

app.mount('#app');
