// https://www.tutorialspoint.com/levenshtein-distance-in-javascript
const getLevenshteinDistance = (a, b) => {
  const track = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i += 1) {
    track[0][i] = i;
  }
  for (let j = 0; j <= b.length; j += 1) {
    track[j][0] = j;
  }
  for (let j = 1; j <= b.length; j += 1) {
    for (let i = 1; i <= a.length; i += 1) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }
  return track[b.length][a.length];
};


const withoutIndex = (word, i) => {
  return word.slice(0, i) + word.slice(i + 1);
}

const isSingleLetterAdd = (shorterWord, longerWord) => {
  if (longerWord.length === shorterWord.length + 1) {
    for (let i = 0; i < longerWord.length; i++) {
      if (shorterWord === withoutIndex(longerWord, i)) {
        return true;
      }
    }
  }
  return false;
};

const isReverse = (a, b) => {
  return a.length === b.length
    && b === a.split('').reverse().join('');
};

const isLetterSwap = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return false;
  }

  const diffIndices = [];
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      diffIndices.push(i);
    }
    if (diffIndices.length > 2) {
      break;
    }
  }
  if (diffIndices.length > 2) {
    return false;
  }
  return a[diffIndices[0]] === b[diffIndices[1]]
    && b[diffIndices[0]] === a[diffIndices[1]];
};

const rotateRight = (word) => {
  return word.substring(word.length - 1, word.length) + word.substring(0, word.length - 1);
};

const isSingleLetterShift = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  if (a === b) {
    return false;
  }

  let startIndex, endIndex;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      startIndex = i;
      break;
    }
  }

  for (let i = 0; i < a.length; i++) {
    if (a[a.length - 1 - i] !== b[b.length - 1 - i]) {
      endIndex = a.length - 1 - i;
      break;
    }
  }

  const aSlice = a.substring(startIndex, endIndex + 1);
  const bSlice = b.substring(startIndex, endIndex + 1);
  return aSlice === rotateRight(bSlice)
    || bSlice === rotateRight(aSlice);
};

export const wordsAreCloseEnough = (a, b) => {
  if (getLevenshteinDistance(a, b) === 1) {
    return true;
  }

  const lengthDifference = b.length - a.length;
  if (lengthDifference === 0) {
    return isReverse(a, b) || isLetterSwap(a, b) || isSingleLetterShift(a, b);
  }

  if (Math.abs(lengthDifference) === 1) {
    const longerWord = lengthDifference === 1 ? b : a;
    const shorterWord = lengthDifference === 1 ? a : b;
    return isSingleLetterAdd(shorterWord, longerWord);
  }

  return false;
};

export const wordExists = async (word) => {
  const frequencyURL = `https://api.wordnik.com/v4/word.json/${word}/frequency?useCanonical=false&startYear=1950&api_key=c23b746d074135dc9500c0a61300a3cb7647e53ec2b9b658e`;
  const frequencyRes = await fetch(frequencyURL);
  if (frequencyRes.status === 404) {
    // 0 usage
    return false;
  }

  if (frequencyRes.ok) {
    // Return frequency
    const frequencyResObject = await frequencyRes.json();
    return frequencyResObject.totalCount >= 200;
  } else {
    console.error(`${frequencyRes.status}`);
  }

  // Fallback to a dictionary
  const res = await fetch(`https://cdn.jsdelivr.net/gh/TodoCleverNameHere/valid-words@master/en_US/${word}.json`);
  if (!res.ok) {
    return false;
  }
};
