const OPEN_WEATHER_API_KEY = "d4c95a6ae05e284c2403921a117a8a6f";

class WeatherStation {
  constructor({ onInit }) {
    this.forecast = null;

    onInit && onInit(this);
  }

  updateWeatherData({ lat, lng, onSucces, onError }) {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPEN_WEATHER_API_KEY}`
    )
      .then((res) => res.json())
      .then((res) => {
        this.forecast = res;
        console.log(this.forecast);
      })
      .catch(console.error);
  }
  displayWeatherForecast() {}
}

export default WeatherStation;
