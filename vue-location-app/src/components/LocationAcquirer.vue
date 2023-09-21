<template>
  <div>
    <button @click="getLocation">Get Current Location</button>
    <div v-if="location">
      Latitude: {{ location.latitude }}<br>
      Longitude: {{ location.longitude }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      location: null
    };
  },
  methods: {
    getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
          this.location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        });
      } else {
        alert('Geolocation is not supported by this browser.');
      }
    }
  }
};
</script>
