const OPEN_WEATHER_API_KEY = "OPEN_WEATHER_API_KEY";

class WeatherStation {
  constructor({ rootSelector, callbacks = {} }) {
    this.status = "idle";
    this.placeName = "-";
    this.forecast = {
      temp: "-",
      pressure: "-",
      humidity: "-",
    };
    this.elements = {
      container: document.createElement("div"),
      searchPanel: document.createElement("div"),
      searchControl: document.createElement("input"),
      autocompleteList: document.createElement("ul"),
      infoPanel: document.createElement("div"),
    };
    this.callbacks = { ...callbacks };

    this.#init(rootSelector);
  }

  #init(rootSelector) {
    const root = document.querySelector(rootSelector);

    if (!root) {
      console.error("Unable to find root element");
      return;
    }

    // prettier-ignore
    const {
      container,
      infoPanel,
      autocompleteList,
      searchControl,
      searchPanel
    } = this.elements;

    container.classList.add("weather__container");
    infoPanel.classList.add("weather__info");
    root.classList.add("weather");
    autocompleteList.classList.add("weather__autocomplete");
    searchControl.classList.add("weather__search-control");
    searchControl.placeholder = "Введіть назву населеного пункту...";
    searchControl.type = "text";
    searchPanel.classList.add("weather__search");

    searchPanel.append(searchControl, autocompleteList);
    container.append(searchPanel, infoPanel);
    root.append(container);

    this.displayWeatherForecast();
    this.#handleSearch();
  }

  async #fetchWeatherByPlaceName(placeName) {
    if (placeName.length === 0) {
      return [];
    }

    try {
      const response = await fetch(
        `http://api.openweathermap.org/geo/1.0/direct?q=${placeName}&lang=en&limit=5&appid=${OPEN_WEATHER_API_KEY}`
      );

      if (!response.ok) throw Error(response.statusText);

      const responseData = await response.json();

      if (!Array.isArray(responseData)) throw Error(responseData);

      return responseData;
    } catch (error) {
      console.error(error);
    }
  }

  async #handleSearch() {
    const { searchControl, autocompleteList } = this.elements;
    let debounceTimer = null;

    searchControl.addEventListener("input", async (e) => {
      clearInterval(debounceTimer);
      autocompleteList.innerHTML = "";

      debounceTimer = setTimeout(async () => {
        const value = e.target.value.trim();
        const places = await this.#fetchWeatherByPlaceName(value);

        const items = places.map((data) => {
          const { local_names, lat, lon: lng, name, state, country } = data;

          const placeName = local_names?.uk ?? name;
          const placeState = state ? `, ${state}` : "";
          const placeCountry = country ? `, ${country}` : "";

          const listItem = document.createElement("li");
          listItem.classList.add("weather__autocomplete-item");
          listItem.textContent = `#${placeName}${placeState}${placeCountry}`;

          listItem.addEventListener("click", async (e) => {
            autocompleteList.innerHTML = "";
            searchControl.value = "";

            if (typeof this.callbacks?.onAutocompleteSelect === "function") {
              await this.callbacks.onAutocompleteSelect(e, data);
            }

            await this.fetchWeatherData({ lat, lng });
          });
          return listItem;
        });

        if (items.length === 0) {
          const listItem = document.createElement("li");
          listItem.classList.add(
            "weather__autocomplete-item",
            "weather__autocomplete-item--not-found"
          );
          listItem.textContent = "Локацію не знайдено...";
          items.push(listItem);
        }

        autocompleteList.append(...items);
      }, 1000);
    });

    document.addEventListener("click", (e) => {
      if (e.target !== autocompleteList) {
        autocompleteList.innerHTML = "";
      }
    });
  }

  async fetchWeatherData({ lat, lng }) {
    try {
      this.status = "loading";
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );
      const responseData = await response.json();
      const { temp, pressure, humidity } = responseData.main;
      this.updateWeatherData({ temp, pressure, humidity });
    } catch (error) {
      console.error(error);
    } finally {
      this.status = "idle";
    }
  }

  updateWeatherData({ temp, pressure, humidity }) {
    this.forecast.temp = temp.toFixed();
    this.forecast.pressure = (pressure * 0.750063755419211).toFixed();
    this.forecast.humidity = humidity;
    this.displayWeatherForecast();
  }

  displayWeatherForecast() {
    console.log(this.placeName);
    this.elements.infoPanel.innerHTML = `
      <h2 class="weather__place-name">${this.placeName}</h2>
      <ul class="weather__stats-list">
        <li class="weather__stats-item">
          <span class="weather__stats-name">Температура</span>
          <span class="weather__stats-value">
            ${this.forecast.temp}
            <em class="weather__stats-unit">°C</em>
          </span>
          
        </li>
        <li class="weather__stats-item">
        <span class="weather__stats-name">Атм. тиск</span>
          <span class="weather__stats-value">
            ${this.forecast.pressure}
            <em class="weather__stats-unit">мм</em>
          </span>
          
        </li>
        <li class="weather__stats-item">
          <span class="weather__stats-name">Вологість</span>
          <span class="weather__stats-value">
            ${this.forecast.humidity}
            <em class="weather__stats-unit">%</em>
          </span>
          
        </li>
      </ul>
    `;
  }
}

export default WeatherStation;
