module.exports = {
  HEADER_LENGTH: 256, // Size of encrypted file header which contains sessionKey, iv and AuthTag
  SESSION_KEY_LENGTH: 32, // 256 bits (32 characters)
  IV_LENGTH: 16, // For AES, this is always 16
}