export const parseGroupsConflict = (listString) => {
  const replacedStr = listString.replace(/\(/g, "[").replace(/\)/g, "]");

  // Parse the string into an array of arrays
  const arrayOfArrays = JSON.parse(replacedStr);

  // Map each inner array to an array of integers
  const result = arrayOfArrays.map((innerArray) => innerArray.map(Number));
  return result;
};

export const reverseParseGroupsConflict = (arrayOfArrays) => {
  // Convert each inner array to a string representation
  var stringArrays = arrayOfArrays.map(function (innerArray) {
    return "(" + innerArray.join(", ") + ")";
  });

  // Combine the string representations with commas
  var resultingString = "[" + stringArrays.join(", ") + "]";

  return resultingString;
};
