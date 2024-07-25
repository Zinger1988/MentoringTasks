// Створіть масив з трьох імен. Додайте нове ім'я до кінця масиву і виведіть його.
const names = ["Piter", "Anna", "Steven"];
names.push("Harry");

console.log(names.at(-1));

// Видаліть перший елемент масиву і виведіть його.
const firstName = names.shift();
console.log(firstName);

// Знайдіть індекс елемента зі значенням "John" в масиві ["Mike", "John", "Sara"].
const namesAlt = ["Mike", "John", "Sara"];
const index = namesAlt.indexOf("John");
console.log(index);
