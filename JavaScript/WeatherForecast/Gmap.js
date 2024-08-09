class GMap {
  constructor({ rootSelector, lng = 30.5049771, lat = 50.4520901, callbacks = {} }) {
    this.map = null;
    this.marker = null;
    this.geocoder = null;
    this.mapContainer = null;
    this.callbacks = { ...callbacks };

    this.init({ rootSelector, lng, lat });
  }

  async init({ rootSelector, lng, lat }) {
    const root = document.querySelector(rootSelector);

    if (!root) {
      console.error("Unable to find root element");
      return;
    }

    this.mapContainer = root;
    this.mapContainer.classList.add("gmap");

    this.map = new google.maps.Map(root, {
      zoom: 8,
      center: { lat, lng },
      mapTypeControl: false,
    });
    this.geocoder = new google.maps.Geocoder();
    this.marker = new google.maps.Marker({
      map: this.map,
    });

    if (typeof this.callbacks?.onInit === "function") {
      this.callbacks.onInit(this);
    }
    return this;
  }

  async getCurrentPosition() {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    )
      .then((position) => {
        const { longitude: lng, latitude: lat } = position.coords;
        this.map.setCenter({ lng, lat });
        this.marker.setPosition({ lng, lat });
        return { lng, lat };
      })
      .catch((error) => {
        console.error(error);
      });
  }

  async getClosestPlaceByCoords({ lng, lat }) {
    const { results, placeName } = await this.#geocode({
      location: { lng, lat },
    });
    const { lat: getLatitude, lng: getLongitude } = results[0].geometry.location;
    const placeLat = getLatitude();
    const placeLng = getLongitude();
    return {
      placeName,
      lat: placeLat,
      lng: placeLng,
    };
  }

  #gettowncity(addcomp) {
    if (typeof addcomp == "object" && addcomp instanceof Array) {
      let order = ["sublocality_level_1", "neighborhood", "locality", "postal_town"];

      for (let i = 0; i < addcomp.length; i++) {
        let obj = addcomp[i];
        let types = obj.types;
        if (this.#intersect(order, types).size > 0) return obj;
      }
    }
    return false;
  }

  #intersect(a, b) {
    return new Set(a.filter((v) => ~b.indexOf(v)));
  }

  #getCityName(results) {
    if (google.maps.GeocoderStatus.OK) {
      let addcomp = results[0].address_components;
      let obj = this.#gettowncity(addcomp);

      return obj ? obj.long_name : "Локація невідома";
    }
  }

  async #geocode(request) {
    this.marker.setMap(null);
    return this.geocoder
      .geocode(request)
      .then((result) => {
        const { results } = result;
        const placeName = this.#getCityName(results);
        this.map.setCenter(results[0].geometry.location);
        this.marker.setPosition(results[0].geometry.location);
        this.marker.setMap(this.map);
        return { placeName, ...result };
      })
      .catch((e) => {
        alert("Geocode was not successful for the following reason: " + e);
      });
  }
}

export default GMap;
