const crypto = require('crypto');
const convert = require('./convert');

/**
 * Calculates sha256 checksum string and slice it to ensure final output to be chunckable by 11bits
 * @param {String} split input string from which to derive the checksum
 * @returns String
 */
 function deriveChecksumBits(split) {
  const checkSize = (33 - (split.length * 8 + 6) % 33); // to ensure chunks of 11bits
  const hash = crypto.createHash('sha256').update(split).digest();

  return convert.decToBin(checkSize) + convert.bytesToBinary(Array.from(hash)).slice(0, checkSize);
}

module.exports = deriveChecksumBits;
