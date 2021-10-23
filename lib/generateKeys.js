const sss = require('shamirs-secret-sharing');
const crypto = require('crypto');
const convert = require('./convert');
const deriveChecksumBits = require('./deriveChecksumBits');

/**
 * Converts Stron to array of memoizable words
 * @param {String} split String to memoize
 * @returns Array
 */
function memoizeSplit(split, wordlist) {
  const binarySplit = convert.bytesToBinary(Array.from(split)); //to binary string 8bits each joinned
  const checksumBits = deriveChecksumBits(split);
  const bits = checksumBits + binarySplit;
  const chunks = bits.match(/(.{1,11})/g);

  return chunks.map((binary) => {
    const index = parseInt(binary, 2);
    return wordlist[index];
  });
}

async function generateKeys({ wordlist, shares = 6, threshold = 5, keySize = 256 }) {
  const passphrase = crypto.randomBytes(keySize).toString('hex').slice(0, keySize);
  const splits = sss.split(passphrase, { shares, threshold }).map(split => memoizeSplit(split, wordlist));
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase,
    },
  });

  return { publicKey, privateKey, passphrase, splits };
}

module.exports = generateKeys;
