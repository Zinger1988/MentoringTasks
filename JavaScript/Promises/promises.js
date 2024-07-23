// Створіть проміс, який резолвиться через 2 секунди з повідомленням "Promise resolved!".
// Використовуйте then для виведення повідомлення, коли проміс буде резолвлено.
const resolvedPromise = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Promise resolved!"), 2000);
}).then((res) => {
  console.log(res);
});

// Створіть проміс, який відхиляється з помилкою "Promise rejected!" та обробіть цю помилку за допомогою catch.
const rejectedPromise = new Promise((resolve, reject) => {
  setTimeout(() => reject(new Error("Promise rejected!")), 2000);
}).catch((error) => console.log(error.message));
