class Hotel {
  #rooms = [];

  constructor(name) {
    this.name = name;
  }

  createRoom() {
    const lastRoomNumber = this.#rooms.length !== 0 ? this.#rooms.at(-1).number : 1;
    this.#rooms.push(new Room(lastRoomNumber + 1));
  }

  getBookedRooms() {
    return this.#rooms.filter((room) => room.checkIsBooked());
  }

  getAllRooms() {
    return this.#rooms;
  }

  bookRoom(number) {
    const foundedRoom = this.#rooms.find((room) => room.number === number);

    if (!foundedRoom) {
      console.log(`Room with number #${number} is not exists`);
      return;
    }

    foundedRoom.bookRoom();
    console.log(`Room #${number} successfully booked`);
  }
}

class Room {
  #isBooked = false;

  constructor(number) {
    this.number = number;
  }

  bookRoom() {
    this.#isBooked = true;
  }

  checkIsBooked() {
    return this.#isBooked;
  }
}

const hotelKiyv = new Hotel("Kiyv");
console.log("hotel", hotelKiyv);

hotelKiyv.createRoom();
hotelKiyv.createRoom();
hotelKiyv.createRoom();
hotelKiyv.createRoom();
hotelKiyv.createRoom();
console.log(hotelKiyv.getAllRooms());

hotelKiyv.bookRoom(7);
hotelKiyv.bookRoom(6);

console.log("Booked rooms", hotelKiyv.getBookedRooms());
console.log("All rooms", hotelKiyv.getAllRooms());
