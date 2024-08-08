class GMap {
  constructor() {
    this.map = null;
    this.marker = null;
    this.geocoder = null;
    this.mapContainer = document.createElement("div");

    this.init();
  }

  init() {
    this.mapContainer.id = "map";
    this.map = new google.maps.Map(this.mapContainer, {
      zoom: 8,
      center: { lat: -34.397, lng: 150.644 },
      mapTypeControl: false,
    });
    this.geocoder = new google.maps.Geocoder();
    this.marker = new google.maps.Marker({
      map: this.map,
    });

    return this;
  }

  geocode(request) {
    this.marker.setMap(null);
    return this.geocoder
      .geocode(request)
      .then((result) => {
        const { results } = result;
        this.map.setCenter(results[0].geometry.location);
        this.marker.setPosition(results[0].geometry.location);
        this.marker.setMap(this.map);
        return result;
      })
      .catch((e) => {
        alert("Geocode was not successful for the following reason: " + e);
      });
  }
}

export default GMap;
