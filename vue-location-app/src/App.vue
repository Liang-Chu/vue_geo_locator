<template>
  <!-- Main application container -->
  <div id="app" style="display: flex; height: 85vh">
    <!-- Left section containing the map and title -->
    <div style="flex: 1.5; padding-right: 2vh">
      <!-- Container for displaying the Google Map -->
      <div id="map"></div>
    </div>

    <!-- Right section containing everything else -->
    <div style="flex: 1">
      <!-- Loading and error messages -->
      <div v-if="loading">Loading...</div>
      <div v-if="errorMessage">{{ errorMessage }}</div>

      <!-- Button to trigger fetching of the current location and Display address, Time Zone, and Local Time -->
      <div style="display: flex; justify-content: space-between">
        <div>
          <!-- Input field for location search with a button -->
          <div style="display: flex; margin-top: 1vh">
            <input
              type="text"
              class="myInput"
              v-model="searchInput"
              @keyup.enter="searchLocation"
            />
            <button class="myButton" @click="searchLocation">Search</button>
          </div>
          <button
            class="myButton"
            @click="getCurrentLocation"
            style="margin-top: 1vh"
          >
            Current Location
          </button>
          <div>
            <!-- Delete button to remove selected locations -->
            <button @click="deleteSelected">Delete Selected</button>
          </div>
        </div>

        <!-- Display Address, Time Zone, and Local Time on the right side -->
        <div
          style="
            margin-top: 1vh;
            padding-right: 1vh;
            width: 32vh;
            text-align: end;
          "
        >
          <p>{{ currentAddress }}</p>
          <p v-if="timeZone">Time Zone: {{ timeZone }}</p>
          <p v-if="localTime">Local Time: {{ localTime }}</p>
        </div>
      </div>

      <!-- Table to display searched locations -->
      <table>
        <thead>
          <tr>
            <!-- Checkbox for selecting all locations -->
            <th>
              <input
                type="checkbox"
                @change="selectAll"
                v-model="allSelected"
              />
            </th>
            <th>Address</th>
            <th>Coordinates</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loop through locations and display each one in a table row -->
          <tr v-for="(location, index) in displayedLocations" :key="index">
            <td>
              <input
                type="checkbox"
                v-model="selectedLocations"
                :value="index"
              />
            </td>
            <td>{{ location.name }}</td>
            <td>{{ location.lat }}, {{ location.lng }}</td>
          </tr>
        </tbody>
      </table>

      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <!-- Pagination controls -->
        <div>
          <button @click="firstPage">First</button>
          <button @click="prevPage">Prev</button>
          Page {{ currentPage }} of {{ totalPages }}
          <button @click="nextPage">Next</button>
          <button @click="lastPage">Last</button>
        </div>

        <button @click="deleteAll" class="delete-all-button">Delete All</button>
      </div>
    </div>
    <!-- End of right section -->
  </div>
  <!-- End of main application container -->
</template>
<script>
/* global google */
import axios from "axios";

const DEFAULT_ZOOM_LEVEL = 4;
const DEFAULT_CURRENT_PAGE = 1;
const DEFAULT_PER_PAGE = 10;
const DEFAULT_LAT = 0;
const DEFAULT_LNG = 0;
export default {
  name: "App",

  // Data properties for the app's reactive state
  data() {
    return {
      searchInput: "", // User's search input
      locations: [], // Stores the user's saved locations
      loading: false, // Indicates if a process is loading
      errorMessage: "", // Stores any error messages
      markers: [], // Markers on the map
      allSelected: false, // Select-all flag for locations
      timer: null, // Used for any timing events, like debouncing
      currentAddress: "", // Currently displayed or selected address

      // Map related properties
      mapCenter: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
      mapZoom: DEFAULT_ZOOM_LEVEL,
      currentPage: DEFAULT_CURRENT_PAGE, // Pagination related properties
      perPage: DEFAULT_PER_PAGE,
      selectedLocations: [], // List of locations currently selected by the user
      timeZone: "", // Time zone of the current address
      localTime: "", // Local time of the current address
    };
  },

  computed: {
    // Calculate the start index for pagination
    startIndex() {
      return (this.currentPage - 1) * this.perPage;
    },
    // Calculate the end index for pagination
    endIndex() {
      return this.startIndex + this.perPage;
    },
    // Determine which locations to display based on pagination
    displayedLocations() {
      return this.locations.slice(this.startIndex, this.endIndex);
    },
    // Calculate total pages for pagination
    totalPages() {
      return Math.ceil(this.locations.length / this.perPage);
    },
  },

  methods: {
    // Handle and present geolocation errors to the user
    handleError(error) {
      if (error.code) {
        switch (error.code) {
          // Handle specific geolocation error codes
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
      } else {
        this.errorMessage = error.message || "An error occurred.";
      }
    },
    // Reset app state and clear locations
    deleteAll() {
      this.locations = [];
      this.currentAddress = "";
      this.timeZone = "";
      this.localTime = "";
      this.selectedLocations = [];
      this.allSelected = false;
      this.currentPage = DEFAULT_CURRENT_PAGE;
      this.initMap(DEFAULT_LAT, DEFAULT_LNG); // Reset map to default state

      // Clear saved data from local storage
      localStorage.removeItem("locations");
      localStorage.removeItem("currentAddress");
      localStorage.removeItem("timeZone");
      localStorage.removeItem("localTime");
      localStorage.removeItem("mapCenter");
      localStorage.removeItem("mapZoom");
    },
    // Handle the select-all functionality for the locations
    selectAll() {
      if (this.allSelected) {
        this.selectedLocations = this.displayedLocations.map(
          (_, index) => index
        );
      } else {
        this.selectedLocations = [];
      }
    }, // Deletes selected location items
    deleteSelected() {
      this.selectedLocations.sort((a, b) => b - a); // Sort selected locations in descending order
      this.selectedLocations.forEach((index) => {
        this.locations.splice(this.startIndex + index, 1); // Remove the selected location
        this.saveToLocalStorage;
      });
      this.selectedLocations = []; // Clear selected locations array

      this.allSelected = false; // Reset 'select all' flag
    },

    // Fetches the timezone and local time based on given latitude and longitude
    async fetchTimeZoneAndLocalTime(lat, lng) {
      try {
        // Make an API call to fetch timezone information
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/timezone/json",
          {
            params: {
              location: `${lat},${lng}`,
              timestamp: Math.floor(Date.now() / 1000), // Convert current time to UNIX timestamp
              key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY, // API key from environment variables
            },
          }
        );

        if (response.data && response.data.timeZoneId) {
          this.timeZone = response.data.timeZoneId; // Set the fetched timezone

          // Clear any existing interval
          if (this.timer) {
            clearInterval(this.timer);
          }

          // Calculate and update local time every second
          this.timer = setInterval(() => {
            const date = new Date();
            const localTimeOffset =
              date.getTime() +
              date.getTimezoneOffset() * 60000 + // Account for local timezone offset
              response.data.rawOffset * 1000 +
              response.data.dstOffset * 1000;
            this.localTime = new Date(localTimeOffset).toLocaleTimeString();
          }, 1000); // Interval set for every second

          // Initial calculation of local time
          const date = new Date();
          const localTimeOffset =
            date.getTime() +
            date.getTimezoneOffset() * 60000 +
            response.data.rawOffset * 1000 +
            response.data.dstOffset * 1000;
          this.localTime = new Date(localTimeOffset).toLocaleTimeString();
        }
      } catch (error) {
        this.handleError(error); // Handle any errors from the API call
      }
    },

    // Gets the current geolocation of the user
    getCurrentLocation() {
      if (navigator.geolocation) {
        // If geolocation is supported by the browser
        navigator.geolocation.getCurrentPosition(
          this.handleGeolocationSuccess, // Success handler
          this.handleError // Error handler
        );
      } else {
        this.errorMessage = "Geolocation is not supported by this browser.";
      }
    },
    // Handle the successful retrieval of geolocation
    async handleGeolocationSuccess(position) {
      const { latitude, longitude } = position.coords; // Destructure the latitude and longitude from the position object
      await this.reverseGeocode(latitude, longitude); // Reverse geocode to get address details

      // Fetch the relevant time zone and local time
      await this.fetchTimeZoneAndLocalTime(latitude, longitude);

      // Set the current address to include the local time
      this.currentAddress = `${this.currentAddress}, Local Time: ${this.localTime}`;

      this.initMap(latitude, longitude); // Initialize map with given coordinates
    },

    // Converts latitude and longitude into human-readable address
    async reverseGeocode(lat, lng) {
      try {
        // Make API call to reverse geocode given coordinates
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              latlng: `${lat},${lng}`,
              key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY, // Use API key from environment variables
            },
          }
        );

        // If the response contains address data
        if (response.data.results.length > 0) {
          const name = response.data.results[0].formatted_address; // Get the full address
          const addressComponents = response.data.results[0].address_components; // Break down the address into its components

          // Extract city, state, and country from the address components
          const city =
            addressComponents.find((comp) => comp.types.includes("locality"))
              ?.short_name || "";
          const state =
            addressComponents.find((comp) =>
              comp.types.includes("administrative_area_level_1")
            )?.short_name || "";
          const country =
            addressComponents.find((comp) => comp.types.includes("country"))
              ?.short_name || "";

          // Construct the address string
          this.currentAddress = `${city}, ${state}, ${country}`;
          // Add the address to the list of locations
          this.locations.unshift({
            name,
            lat,
            lng,
          });
        } else {
          console.error("No results found for reverse geocoding.");
        }
      } catch (error) {
        this.handleError(error); // Handle any errors encountered during the API call
      }
    },

    // Search for a location using a search input
    async searchLocation() {
      this.loading = true; // Start the loading state
      this.errorMessage = ""; // Reset any previous error messages

      try {
        // Make an API call to search for a location by name or address
        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address: this.searchInput, // The search query
              key: process.env.VUE_APP_GOOGLE_MAPS_API_KEY, // Use API key from environment variables
            },
          }
        );

        // If the response contains results
        if (response.data.results.length > 0) {
          const { lat, lng } = response.data.results[0].geometry.location; // Extract the latitude and longitude from the results

          // Update address, fetch time zone and local time, and save the locations in sequence
          await this.reverseGeocode(lat, lng);
          await this.fetchTimeZoneAndLocalTime(lat, lng);
          this.saveToLocalStorage();
          this.initMap(lat, lng); // Initialize the map with the found coordinates
        } else {
          this.errorMessage = `No results found for ${this.searchInput}`; // Set error message if no results are found
        }
      } catch (error) {
        this.handleError(error); // Handle any errors encountered during the search
      } finally {
        this.loading = false; // End the loading state
      }
    },
    // Save various app states to local storage for persistence
    saveToLocalStorage() {
      localStorage.setItem("locations", JSON.stringify(this.locations));
      localStorage.setItem("currentAddress", this.currentAddress);
      localStorage.setItem("timeZone", this.timeZone);
      localStorage.setItem("localTime", this.localTime);
      localStorage.setItem("mapCenter", JSON.stringify(this.mapCenter));
      localStorage.setItem("mapZoom", this.mapZoom);
    },

    // Initialize or re-initialize the Google Map with given latitude and longitude
    initMap(lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
      const mapCenter = { lat, lng };
      // Create a new Google Map instance
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: this.mapZoom,
        center: mapCenter,
      });

      // Listen for map center changes and save to local storage
      google.maps.event.addListener(map, "center_changed", () => {
        this.mapCenter = map.getCenter().toJSON();
        this.saveToLocalStorage();
      });

      // Listen for zoom level changes and save to local storage
      google.maps.event.addListener(map, "zoom_changed", () => {
        this.mapZoom = map.getZoom();
        this.saveToLocalStorage();
      });

      // Remove previous markers if any
      this.markers.forEach((marker) => marker.setMap(null));
      this.markers = [];

      // Add markers for all saved locations
      this.locations.forEach((location) => {
        const marker = new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map,
        });
        this.markers.push(marker);
      });

      // Update the app's map center and zoom level state
      this.mapCenter = mapCenter;
      this.mapZoom = map.getZoom();
      this.saveToLocalStorage();
    },

    // Navigation methods for pagination
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    firstPage() {
      this.currentPage = 1;
    },

    lastPage() {
      this.currentPage = this.totalPages;
    },
  },

  // Lifecycle hook: when the Vue instance is created
  created() {
    // Load saved states from local storage
    const storedLocations = localStorage.getItem("locations");
    const storedAddress = localStorage.getItem("currentAddress");
    const storedTimeZone = localStorage.getItem("timeZone");
    const storedLocalTime = localStorage.getItem("localTime");
    const storedMapCenter = localStorage.getItem("mapCenter");
    const storedMapZoom = localStorage.getItem("mapZoom");

    // Set app's data properties if storage items exist
    if (storedLocations) this.locations = JSON.parse(storedLocations);
    if (storedAddress) this.currentAddress = storedAddress;
    if (storedTimeZone) this.timeZone = storedTimeZone;
    if (storedLocalTime) this.localTime = storedLocalTime;
    if (storedMapCenter) this.mapCenter = JSON.parse(storedMapCenter);
    if (storedMapZoom) this.mapZoom = parseInt(storedMapZoom);
  },

  // Lifecycle hook: after the Vue instance has been mounted to the DOM
  mounted() {
    if (typeof google === "object" && typeof google.maps === "object") {
      // If Google Maps API is loaded, initialize the map
      this.initMap(this.mapCenter.lat, this.mapCenter.lng);
    } else {
      // If not, wait for the custom event indicating the API has loaded
      window.addEventListener("googlemapsloaded", () => {
        this.initMap(this.mapCenter.lat, this.mapCenter.lng);
      });
    }
  },
};
</script>
