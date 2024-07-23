// Створіть асинхронну функцію, яка повертає "Hello, World!" через 1 секунду.
// Викличте цю функцію і виведіть результат в консоль.
// Використовуйте try/catch для обробки помилки в асинхронній функції, яка кидає помилку.

async function printHelloWithDelay() {
  const helloMessage = await new Promise((resolve, reject) =>
    setTimeout(() => {
      Math.random() > 0.5 ? resolve("Hello world") : reject(new Error("Random error"));
    }, 1000)
  );
  return helloMessage;
}

try {
  printHelloWithDelay().then((res) => console.log(res));
} catch (err) {
  console.log(`Error: ${err.message}`);
}
