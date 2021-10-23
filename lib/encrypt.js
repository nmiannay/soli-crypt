const crypto = require('crypto');

function encrypt(data, publicKey) {
  const iv = crypto.randomBytes(16);
  const sessionKey = crypto.randomBytes(32);
  const cipher = crypto.createCipheriv('aes-256-gcm', sessionKey, iv);
  const encryptedData = Buffer.concat([cipher.update(Buffer.from(data)), cipher.final()]);
  const encryptedKey = crypto.publicEncrypt(
    {
      key: publicKey.toString(),
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.concat([sessionKey, iv, cipher.getAuthTag()])
  );

  return Buffer.concat([encryptedKey, encryptedData]);
}

module.exports = encrypt