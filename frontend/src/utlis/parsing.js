
export const parseGroupsConflict = (input, ratingValue = null) => {
  if (typeof input === "string" && input.length > 0) {
    const replacedStr = input.replace(/\(/g, "[").replace(/\)/g, "]");
    const arrayOfArrays = JSON.parse(replacedStr);
    const result = arrayOfArrays.map((innerArray) => innerArray.map(Number));
    return result;
  }

  if (Array.isArray(input) && ratingValue !== null) {
    return input.map(g => [g, ratingValue]);
  }

  if (Array.isArray(input) && ratingValue === null) {
    console.warn("[parseGroupsConflict] Array без ratingValue:", input);
    return [];
  }

  console.error("[parseGroupsConflict] Unexpected input:", input);
  return [];
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
