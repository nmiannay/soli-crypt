const sss = require('shamirs-secret-sharing');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { promisify } = require('util');
const convert = require('./convert');
const deriveChecksumBits = require('./deriveChecksumBits');
const { HEADER_LENGTH, SESSION_KEY_LENGTH, IV_LENGTH } = require('./constants');

const pipelineAsync = promisify(pipeline);

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

async function decrypt(readStream, writeStream, { privateKey, splits, wordlist }) {
  const passphrase = sss.combine(splits.map(split => splitMemoize(split, wordlist)));

  if (!passphrase) {
    throw new Error('Unable to decrypt passphrase');
  }

  const encryptedMetas = readStream.read(HEADER_LENGTH);
  const decryptedMetas = crypto.privateDecrypt(
    {
      key: privateKey.toString(),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
      passphrase,
    },
    encryptedMetas
  );
  const sessionKey = decryptedMetas.slice(0, SESSION_KEY_LENGTH);
  const iv = decryptedMetas.slice(SESSION_KEY_LENGTH, SESSION_KEY_LENGTH + IV_LENGTH);
  const authTag = decryptedMetas.slice(SESSION_KEY_LENGTH + IV_LENGTH, SESSION_KEY_LENGTH + IV_LENGTH + 16);
  const decipher = crypto.createDecipheriv('aes-256-gcm', sessionKey, iv);
  decipher.setAuthTag(authTag);

  return pipelineAsync(
    readStream,
    decipher,
    writeStream,
  );
}

module.exports = decrypt;
