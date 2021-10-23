/**
 * Converts each bytes in array to binary string of length `size` and join them all
 * @param {Array} bytes array of byte to convert to binary
 * @returns String
 */
 function bytesToBinary(bytes, size = 8) {
  return bytes.map((x) => x.toString(2).padStart(size, '0')).join('');
}

/**
 * Convert word to binary string by finding is index in dictionnary
 * and convert it to binary string of pad length
 * @param {String} word word to convert in binary
 * @returns String
 */
 function wordToBinary(word, wordlist) {
  const index = wordlist.indexOf(word);
  if (index === -1) {
    throw new Error('Invalid mnemonic');
  }
  return index.toString(2).padStart(11, '0');
}

/**
 * Converts Number to binary string of length `size`
 * @param {Number} dec Number to convert
 * @returns String
 */
function decToBin(dec, size = 6) {
  return (dec >>> 0).toString(2).padStart(size, '0');
}

/**
 * Converts binary string to Number
 * @param {String} binary binary string to convert
 * @returns Number
 */
function binToDec(binary) {
  return parseInt(binary, 2);
}

module.exports = {
  bytesToBinary,
  wordToBinary,
  decToBin,
  binToDec,
}