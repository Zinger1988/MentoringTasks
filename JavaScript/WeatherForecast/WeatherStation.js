const OPEN_WEATHER_API_KEY = "OPEN_WEATHER_API_KEY: ";

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

  #handleSearch() {
    const { searchControl, autocompleteList } = this.elements;
    let debounceTimer = null;

    searchControl.addEventListener("input", async (e) => {
      clearInterval(debounceTimer);
      autocompleteList.innerHTML = "";

      debounceTimer = setTimeout(async () => {
        const value = e.target.value.trim();

        if (value.length === 0) {
          return;
        }

        try {
          const response = await fetch(
            `http://api.openweathermap.org/geo/1.0/direct?q=${value}&lang=en&limit=5&appid=${OPEN_WEATHER_API_KEY}`
          );

          if (!response.ok) {
            throw Error(response.statusText);
          }

          const responseData = await response.json();

          if (!Array.isArray(responseData)) {
            throw Error(responseData);
          }

          const items = responseData.map((data) => {
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

              await this.updateWeatherData({ lat, lng });
            });
            return listItem;
          });

          autocompleteList.append(...items);
        } catch (error) {
          console.error(error);
        }
      }, 1000);
    });
  }

  async updateWeatherData({ lat, lng }) {
    this.status = "loading";
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPEN_WEATHER_API_KEY}&units=metric`
      );
      const responseData = await response.json();
      const { temp, pressure, humidity } = responseData.main;
      this.forecast.temp = temp.toFixed();
      this.forecast.pressure = (pressure * 0.750063755419211).toFixed();
      this.forecast.humidity = humidity;
      this.displayWeatherForecast();
    } catch (error) {
      console.error(error);
    } finally {
      this.status = "idle";
    }
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
