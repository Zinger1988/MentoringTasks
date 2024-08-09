import GMap from "./Gmap.js";
import WeatherStation from "./WeatherStation.js";

const DEFAULT_COORDS = { lat: 50.4520901, lng: 30.5049771 };

// STATION
const weatherStation = new WeatherStation({
  rootSelector: "#weather",
  callbacks: {
    onAutocompleteSelect: async (event, data) => {
      const { lat, lon: lng } = data;
      const { placeName } = await gmap.getClosestPlaceByCoords({ lat, lng });
      weatherStation.placeName = placeName;
      console.log(placeName);
    },
  },
});

// MAP INSTANCE
const gmap = new GMap({
  rootSelector: "#map",
  ...DEFAULT_COORDS,
  callbacks: {
    onInit: async (mapInstance) => {
      let initialPlace = { placeName: null, ...DEFAULT_COORDS };

      try {
        const currentCoords = await mapInstance.getCurrentPosition();
        initialPlace = await mapInstance.getClosestPlaceByCoords(currentCoords);
      } catch (error) {
        initialPlace = await mapInstance.getClosestPlaceByCoords(DEFAULT_COORDS);
      }

      weatherStation.placeName = initialPlace.placeName;
      await weatherStation.fetchWeatherData({
        lat: initialPlace.lat,
        lng: initialPlace.lng,
      });
    },
  },
});

gmap.map.addListener("click", async (e) => {
  const selectedCoords = { lng: e.latLng.lng(), lat: e.latLng.lat() };
  const { placeName, lng, lat } = await gmap.getClosestPlaceByCoords(selectedCoords);

  weatherStation.placeName = placeName;
  await weatherStation.fetchWeatherData({ lat, lng });
});
