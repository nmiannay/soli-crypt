const sss = require('shamirs-secret-sharing')
const fs = require('fs')
const crypto = require('crypto')
const wordlist = require('./words.json')

const first = {
};

function bytesToBinary(bytes) {
  return bytes.map((x) => x.toString(2).padStart(8, '0')).join('');
}

function wordToBinary(word) {
  const index = wordlist.indexOf(word);
  if (index === -1) {
    throw new Error('Invalid mnemonic');
  }
  return index.toString(2).padStart(11, '0');
}

function deriveChecksumBits(split) {
  const cs = split.length * 8 / 32;
  const checkSize = cs + (cs * 33) % 11; // to ensure chunks of 11bits
  const hash = crypto.createHash('sha256')
      .update(split)
      .digest();

  // if (first.deriveChecksumBits !== false) {
  //   console.log({ deriveChecksumBits: {l: split.length, checkSize, cs }})
  //   console.log(bytesToBinary(Array.from(hash)).length)
  //   first.deriveChecksumBits = false;
  // }
  return bytesToBinary(Array.from(hash)).slice(0, checkSize);
}

function memoizeSplit(split) {
  const entropyBits = bytesToBinary(Array.from(split)); //to binary string 8bits each joinned
  const checksumBits = deriveChecksumBits(split);
  const bits = entropyBits + checksumBits;
  const chunks = bits.match(/(.{1,11})/g);
  const words = chunks.map((binary) => {
    const index = parseInt(binary, 2);
    return wordlist[index];
  });
  // if (first.memoizeSplit !== false) {
  //   console.log({ l: split.length, bits, bitsL: bits.length, entropyBitsL: entropyBits.length, checksumBits, checkSize: checksumBits.length, wordsL: words.length })
  //   // console.log(bits, bits.length, chunks, checksumBits)
  //   first.memoizeSplit = false;
  // }
  return words.join(' ');
}

function splitMemoize(words, expected) {
  const bits = words.map(wordToBinary);
  const joinedBits = bits.join('')

  let i;
  for (i = joinedBits.length; i > 0; i--) {
    const l = joinedBits.length - i;
    if (joinedBits.length === ((33 * l / 32) + (33 * l / 32) % 11)) {
      break;
    }
  }

  const dividerIndex = i
  const entropyBits = joinedBits.slice(0, -dividerIndex).match(/(.{1,8})/g)
  const checksumBits = joinedBits.slice(-dividerIndex)
  const entropyBytes = entropyBits.map(bin => parseInt(bin, 2))
  const entropy = Buffer.from(entropyBytes)
  const newChecksum = deriveChecksumBits(entropy)

  // console.log({
  //   joinedBits,
  //   entropyBits,
  //   checksumBits,
  //   // l: joinedBits.length,
  //   wordsL: words.length,
  //   dividerIndex,
  //   // checkSize: joinedBits.length - dividerIndex,
  //   _subject: entropy.toString('hex'),
  //   expected
  // })
  if (newChecksum !== checksumBits) {
      throw new Error('Invalid mnemonic checksum');
  }
  return entropy.toString('hex')
}

async function generateKeys({ shares = 6, threshold = 5, keySize = 256 / 8 }) {
  const passphrase = crypto.randomBytes(keySize);
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase
    }
  })

  fs.writeFileSync('./keys/public_key', publicKey)
  fs.writeFileSync('./keys/private_key', privateKey)
  fs.writeFileSync('./keys/passphrase', passphrase.toString('hex'))

  const splits = sss.split(passphrase, { shares, threshold })
// console.log({ shares, threshold })
  splits.forEach((split, index) => {
    const memoizedSplit = memoizeSplit(split)

    fs.writeFileSync(`./keys/share-${index}.memo`, memoizedSplit)
    fs.writeFileSync(`./keys/share-${index}`, split.toString('hex'))
  })
}

function encrypt(data, output, publicKeyPath) {
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8')
  const encryptedData = crypto.publicEncrypt(
    {
      key: publicKey,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Buffer.from(data)
  )

  fs.writeFileSync(output, encryptedData)
  return encryptedData
}

function decrypt(encryptedData, { privateKey, shares, memoshares, output }) {
  const passphrase = sss.combine(memoshares.map((share, i) => {
    const words = share.split(' ')

    return splitMemoize(words, shares[i]);
  }))
  // console.log({ passphrase: passphrase.toString('hex') })

  if (passphrase) {
    const decryptedData = crypto.privateDecrypt(
      {
        key: privateKey.toString(),
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
        passphrase,
      },
      encryptedData
    )

    fs.writeFileSync(output, decryptedData)
    return decryptedData.toString();
  }
  return null;
}

const config = {
  shares: 3,
  threshold: 3,
  keySize: 256 / 8,
};

generateKeys(config)
// console.log('-----')
const encryptedData = encrypt('my secret data', './out/crypted', './keys/public_key')
const decoded = decrypt(
  fs.readFileSync('./out/crypted'),
  {
    privateKey: fs.readFileSync('./keys/private_key'),
    shares: Array.from(Array(config.threshold)).map((_, index) =>
      fs.readFileSync(`./keys/share-${index}`, 'utf8')
    ),
    memoshares: Array.from(Array(config.threshold)).map((_, index) =>
      fs.readFileSync(`./keys/share-${index}.memo`, 'utf8')
    ),
    output: './out/plain'
  }
)
console.log(decoded)
