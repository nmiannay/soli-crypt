const sss = require('shamirs-secret-sharing');
const crypto = require('crypto');
const convert = require('./convert');
const deriveChecksumBits = require('./deriveChecksumBits');

// from array to string
function splitMemoize(words, wordlist) {
  const bits = words.map(word => convert.wordToBinary(word, wordlist));
  const joinedBits = bits.join('');
  const checksumSize = convert.binToDec(joinedBits.slice(0, 6));
  const checksumBits = joinedBits.slice(0, 6 + checksumSize);
  const entropyBits = joinedBits.slice(6 + checksumSize).match(/(.{1,8})/g)
  const entropyBytes = entropyBits.map(bin => parseInt(bin, 2));
  const entropy = Buffer.from(entropyBytes);
  const newChecksum = deriveChecksumBits(entropy);

  if (newChecksum !== checksumBits) {
    throw new Error('Invalid mnemonic checksum');
  }
  return entropy.toString('hex');
}

function decrypt(encryptedData, { privateKey, splits, wordlist }) {
  const passphrase = sss.combine(splits.map(split => splitMemoize(split, wordlist)));

  if (!passphrase) {
    throw new Error('Unable to decrypt passphrase');
  }

  const encryptedMetas = encryptedData.slice(0, 256);
  const decryptedMetas = crypto.privateDecrypt(
    {
      key: privateKey.toString(),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
      passphrase,
    },
    encryptedMetas
  );
  const sessionKey = decryptedMetas.slice(0, 32);
  const iv = decryptedMetas.slice(32, 48);
  const authTag = decryptedMetas.slice(48, 64);
  const decipher = crypto.createDecipheriv('aes-256-gcm', sessionKey, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encryptedData.slice(256)), decipher.final()])
}

module.exports = decrypt;
