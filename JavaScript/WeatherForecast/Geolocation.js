class Geolocation {
  getCurrentPosition(onSuccess, onError) {
    return new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    )
      .then((position) => {
        onSuccess && onSuccess(position);
        return {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
      })
      .catch((error) => {
        onError && onError(error);
        throw error;
      });
  }
}

export default Geolocation;
