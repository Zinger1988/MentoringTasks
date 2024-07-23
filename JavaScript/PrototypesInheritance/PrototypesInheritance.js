/**
 * Завдання:
 *
 * Реалізуйте систему управління бібліотекою книг.
 * Створіть конструктор Book, який має властивості title, author, і year.
 * Потім створіть конструктор EBook, який наслідує Book і додає властивість fileSize та метод для завантаження книги.
 * Додайте метод для виведення інформації про книгу (title і author) в прототип Book і переконайтесь, що EBook успадковує цей метод.
 *
 * Вимоги:
 *
 * Використовуйте прототипи для наслідування.
 * Додайте метод для виведення інформації про книгу до прототипу Book.
 * Створіть метод для завантаження електронної книги в конструкторі EBook.
 * Переконайтесь, що метод для виведення інформації про книгу працює для об'єктів EBook.
 */

function Book({ title, year, author }) {
  this.title = title;
  this.year = year;
  this.author = author;
}

Book.prototype.getInfo = function () {
  return `Title: ${this.title}, year: ${this.year}`;
};

function EBook({ title, year, author, fileSize }) {
  Book.call(this, { title, year, author });
  this.fileSize = fileSize;
  this.uploadBook = function (newTitle, newYear, newAuthor) {
    return `Book (${newTitle}, ${newYear}, ${newAuthor}) uploaded!`;
  };
}

EBook.prototype = Object.create(Book.prototype);

const ebookInstance = new EBook({
  title: "Some awesome Ebook",
  year: 2023,
  author: "John Doe",
  fileSize: 1200,
});

console.log(ebookInstance.getInfo());
// Title: Some awesome Ebook, year: 2023

console.log(ebookInstance.uploadBook("Another awesome EBook", 2024, "Tomas Newman"));
// Book (Another awesome EBook, 2024, Tomas Newman) uploaded!
