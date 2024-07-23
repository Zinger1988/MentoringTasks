// Напишіть функцію, яка приймає два числа і повертає їх суму.
function calcSum(num1, num2) {
  return num1 + num2;
}
console.log(calcSum(4, 7));

// Напишіть функцію, яка приймає рядок і повертає його в верхньому регістрі.
function stringToUpperCase(string) {
  return string.toUpperCase();
}

console.log(stringToUpperCase("some text"));

// Напишіть функцію, яка приймає масив чисел і повертає новий масив з квадратами цих чисел.
function squareNumbers(numbersArr) {
  return numbersArr.map((num) => Math.pow(num, 2));
}

console.log(squareNumbers([2, 3, 4, 5]));
