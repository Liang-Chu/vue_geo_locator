<template>
  <!-- Main application container -->
  <div id="app">
    <!-- Application header -->
    <h1>Welcome to Vue Geo Locator</h1>

    <!-- Button to trigger fetching of current location -->
    <button @click="getCurrentLocation">Get Current Location</button>

    <!-- Input field for location search with a button -->
    <input type="text" v-model="searchInput" @keyup.enter="searchLocation" />
    <button @click="searchLocation">Search</button>

    <!-- Loading and error messages -->
    <div v-if="loading">Loading...</div>
    <div v-if="errorMessage">{{ errorMessage }}</div>

    <!-- Container for displaying the Google Map -->
    <div id="map"></div>


    <!-- Table to display searched locations -->
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Latitude</th>
          <th>Longitude</th>
        </tr>
      </thead>
      <tbody>
        <!-- Loop through locations and display each one in a table row -->
        <tr v-for="(location, index) in locations" :key="index">
          <td>{{ location.name }}</td>
          <td>{{ location.lat }}</td>
          <td>{{ location.lng }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
/* global google */
import axios from "axios"; // Importing axios for making API requests


// Define the default zoom level for the map
const DEFAULT_ZOOM_LEVEL = 4;
export default {
  name: "App",
  data() {
    // Component's reactive data properties
    return {
      searchInput: "", // Input value for location search
      locations: [], // Array to store searched locations
      loading: false, // Flag to indicate loading state
      errorMessage: "", // Message to display any errors
    };
  },

  methods: {
    // Geolocation methods
    getCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          this.handleGeolocationSuccess,
          this.handleGeolocationError
        );
      } else {
        this.errorMessage = "Geolocation is not supported by this browser.";
      }
    },
    handleGeolocationSuccess(position) {
      const { latitude, longitude } = position.coords;
      this.printGeocode(latitude, longitude);
      this.initMap(latitude, longitude);
    },
    handleGeolocationError(error) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          this.errorMessage = "User denied the request for Geolocation.";
          break;
        case error.POSITION_UNAVAILABLE:
          this.errorMessage = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          this.errorMessage = "The request to get user location timed out.";
          break;
        case error.UNKNOWN_ERROR:
          this.errorMessage = "An unknown error occurred.";
          break;
      }
    },


    // Searches for a location using the Google Maps Geocoding API
    async searchLocation() {
      this.loading = true;
      this.errorMessage = "";

      try {
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address: this.searchInput,
              key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
            },
          }
        );

        if (response.data.results.length > 0) {
          const { lat, lng } = response.data.results[0].geometry.location;
          this.locations.push({
            name: this.searchInput,
            lat,
            lng,
          });
          this.initMap(lat, lng);
        } else {
          this.errorMessage = `No results found for ${this.searchInput}`;
        }
      } catch (error) {
        this.errorMessage = `Error fetching location: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },

    // Initializes the Google Map with the given latitude and longitude
    initMap(lat, lng) {
      const mapCenter = { lat, lng };
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: DEFAULT_ZOOM_LEVEL,
        center: mapCenter,
      });
      new google.maps.Marker({
        position: mapCenter,
        map,
      });
    },
    printGeocode(lat, lng) {
      console.log(`Latitude: ${lat}, Longitude: ${lng}`);
    },
  },

  // Lifecycle hook that gets called after the component is mounted
  mounted() {
    this.getCurrentLocation(); // Fetch the current location when the component is mounted
  },
};
</script>
