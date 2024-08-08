import GMap from "./Gmap.js";
import Geolocation from "./Geolocation.js";
import WeatherStation from "./WeatherStation.js";

const DEFAULT_COORDS = { lat: 50.4520901, lng: 30.5049771 };

// GEOLOCATION
const geolocation = new Geolocation();

// MAP INSTANCE
const gmap = new GMap();
gmap.mapContainer.classList.add("forecast__map");
gmap.map.addListener("click", async (e) => {
  const res = await gmap.geocode({ location: e.latLng });
  const { lat: getLatitude, lng: getLongitude } = res.results[0].geometry.location;
  const lat = getLatitude();
  const lng = getLongitude();
  weatherStation.updateWeatherData({ lat, lng });
});

document.body.append(gmap.mapContainer);

// STATION
const weatherStation = new WeatherStation({
  onInit: async (station) => {
    try {
      const coords = await geolocation.getCurrentPosition();
      station.updateWeatherData(coords);
      gmap.map.setCenter(coords);
      gmap.marker.setPosition(coords);
    } catch (error) {
      console.error(error);
      station.updateWeatherData(DEFAULT_COORDS);
      gmap.map.setCenter(DEFAULT_COORDS);
    }
  },
});

// const input = document.getElementById("city");

// let debounceTimer = null;

// input.addEventListener("input", async (e) => {
//   clearInterval(debounceTimer);
//   debounceTimer = setTimeout(() => {
//     const key = "d4c95a6ae05e284c2403921a117a8a6f";
//     const value = e.target.value;
//     fetch(
//       `http://api.openweathermap.org/geo/1.0/direct?q=${value}&lang=en&limit=5&appid=${key}`
//     )
//       .then((res) => res.json())
//       .then((res) => {
//         console.log(res);
//         map.setCenter({ lat: res[0].lat, lng: res[0].lon });
//         marker.setPosition({ lat: res[0].lat, lng: res[0].lon });
//       });
//   }, 1000);
// });
