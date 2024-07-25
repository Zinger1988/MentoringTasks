// Створіть об'єкт, який представляє книгу з властивостями title, author та year.
const book = {
  title: "1984",
  author: "John Orwell",
  year: 1948,
};

// Додайте нову властивість genre до об'єкта книги.
book.genre = "dystopia";

// Видаліть властивість year з об'єкта книги.
delete book.year;

console.log(book);
