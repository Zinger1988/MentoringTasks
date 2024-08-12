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
      clearTimeout(debounceTimer);
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
    this.elements.infoPanel.textContent = "";
    const { temp, pressure, humidity } = this.forecast;
    const statsMap = [
      {
        label: "Температура",
        value: temp,
        unit: "°C",
      },
      {
        label: "Атм. тиск",
        value: pressure,
        unit: "мм",
      },
      {
        label: "Вологість",
        value: humidity,
        unit: "%",
      },
    ];

    const statsTitle = document.createElement("h2");
    statsTitle.classList.add("weather__place-name");
    statsTitle.textContent = this.placeName;

    const statsList = document.createElement("ul");
    statsList.classList.add("weather__stats-list");

    const statsLietElements = statsMap.map((statItem) => {
      const { label, value, unit } = statItem;

      const statsListItem = document.createElement("li");
      statsListItem.classList.add("weather__stats-item");

      const statsName = document.createElement("span");
      statsName.classList.add("weather__stats-name");
      statsName.textContent = label;

      const statsValue = document.createElement("span");
      statsValue.classList.add("weather__stats-value");
      statsValue.textContent = value;

      const statsUnit = document.createElement("em");
      statsUnit.classList.add("weather__stats-unit");
      statsUnit.textContent = unit;

      statsValue.append(statsUnit);
      statsListItem.append(statsName, statsValue);

      return statsListItem;
    });

    statsList.append(...statsLietElements);

    this.elements.infoPanel.append(statsTitle, statsList);
  }
}

export default WeatherStation;
