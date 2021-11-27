const { promises: fs } = require('fs');
const crypto = require('crypto');
const { pipeline } = require('stream');
const { promisify } = require('util');
const { SESSION_KEY_LENGTH, IV_LENGTH } = require('./constants');

const pipelineAsync = promisify(pipeline);

async function encrypt(readStream, writeStream, publicKey) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const sessionKey = crypto.randomBytes(SESSION_KEY_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv);

  await pipelineAsync(
    readStream,
    cipher,
    writeStream
  )

  const header = await crypto.publicEncrypt(
    {
      key: publicKey.toString(),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.concat([sessionKey, iv, cipher.getAuthTag()])
  );

  return fs.writeFile(writeStream.path, header, { flag: 'r+' });
}

module.exports = encrypt