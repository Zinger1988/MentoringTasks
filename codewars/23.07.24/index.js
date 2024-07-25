// Write a function "greet" that returns "hello world!"
function greet() {
  return "hello world!";
}

/**
 * Clock shows h hours, m minutes and s seconds after midnight.
 * Your task is to write a function which returns the time since midnight in milliseconds.
 *
 * Input constraints:
 * 0 <= h <= 23
 * 0 <= m <= 59
 * 0 <= s <= 59
 */

function calcMilliseconds(h, m, s) {
  const hoursToMs = h * 60 * 60 * 1000;
  const minutesToMs = m * 60 * 1000;
  const secondsToMs = s * 1000;

  return hoursToMs + minutesToMs + secondsToMs;
}

/**
 * Simple, given a string of words, return the length of the shortest word(s).
 * String will never be empty and you do not need to account for different data types.
 */

function findShort(str) {
  const words = str.split(" ");
  const wordsLength = words.map((word) => word.length);
  const minWordLength = Math.min.apply(null, wordsLength);

  return minWordLength;
}

/**
 * Complete the solution so that it splits the string into pairs of two characters.
 * If the string contains an odd number of characters then it should replace the
 * missing second character of the final pair with an underscore ('_').
 *
 * Examples:
 * 'abc' =>  ['ab', 'c_']
 * 'abcdef' => ['ab', 'cd', 'ef']
 */

function splitToPairs(str) {
  const res = [];
  for (let i = 0; i < str.length; i += 2) {
    const first = str[i];
    const second = str[i + 1] || "_";
    res.push(first + second);
  }

  return res;
}

console.log(splitToPairs("abcdef"));

/**
 * In this little assignment you are given a string of space separated numbers,
 * and have to return the highest and lowest number.
 *
 * highAndLow("1 2 3 4 5");  // return "5 1"
 * highAndLow("1 2 -3 4 5"); // return "5 -3"
 * highAndLow("1 9 3 4 -5"); // return "9 -5"
 */

function highAndLow(numStr) {
  const numsArr = numStr.split(" ").map((str) => +str);
  const max = Math.max.apply(null, numsArr);
  const min = Math.min.apply(null, numsArr);
  return `${max} ${min}`;
}

console.log(highAndLow("1 2 3 4 5"));

/**
 * Return the number (count) of vowels in the given string.
 * We will consider a, e, i, o, u as vowels for this Kata (but not y).
 * The input string will only consist of lower case letters and/or spaces.
 */

function getCount(str) {
  return 0;
}

/**
 * There was a test in your class and you passed it. Congratulations!
 * But you're an ambitious person. You want to know if you're better than the average student in your class.
 * You receive an array with your peers' test scores. Now calculate the average and compare your score!
 * Return true if you're better, else false!
 * Note:
 * Your points are not included in the array of your class's points. Do not forget them when calculating the average score!
 */

function betterThanAverage(classPoints, yourPoints) {
  const allPoints = [...classPoints, yourPoints];
  const pointsSum = allPoints.reduce((acc, cur) => acc + cur, 0);

  return pointsSum / allPoints.length < yourPoints;
}

/**
 * Given an array with exactly 5 strings "a", "b" or "c" (chars in Java, characters in Fortran),
 * check if the array contains three and two of the same values.
 *
 * ["a", "a", "a", "b", "b"] ==> true  // 3x "a" and 2x "b"
 * ["a", "b", "c", "b", "c"] ==> false // 1x "a", 2x "b" and 2x "c"
 * ["a", "a", "a", "a", "a"] ==> false // 5x "a"
 */

function checkThreeAndTwo(array) {
  const valuesMap = array.reduce((acc, cur) => {
    acc[cur] = acc[cur] ? (acc[cur] += 1) : 1;
    return acc;
  }, {});

  const values = Object.values(valuesMap);

  return values.includes(2) && values.includes(3);
}

console.log(checkThreeAndTwo(["a", "a", "a", "b", "b"]));
console.log(checkThreeAndTwo(["a", "a", "c", "b", "b"]));
