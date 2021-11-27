const path = require('path');
const fs = require('fs').promises;
const yargs = require('yargs');
const generateKeys = require('../lib/generateKeys');
const { configParser } = require('../lib/utils');
const { DEFAULT_WORDS_LIST_PATH } = require('../lib/constants');

const argv = yargs
  .option('wordlist', {
    alias: 'w',
    description: 'The path to world list used to memoize passphrase',
    type: 'string',
    default: DEFAULT_WORDS_LIST_PATH,
    coerce: configParser
  })
  .option('shares', {
    alias: 's',
    description: 'The number of n shares that should be created for this secret',
    type: 'number',
    default: 6,
  })
  .option('threshold', {
    alias: 't',
    description: 'The number of t of n distinct share that are required to reconstruct this secret',
    type: 'number',
    default: 5,
  })
  .option('keySize', {
    alias: 'k',
    description: 'The size of randomly generated passphrase',
    type: 'number',
    default: 256,
  })
  .option('output', {
    alias: 'o',
    description: 'The path to store generated files',
    type: 'string',
    default: process.cwd(),
  })
  .help()
  .alias('help', 'h')
  .argv;

(async function main() {
  const { publicKey, privateKey, splits } = await generateKeys({
    wordlist: argv.wordlist,
    shares: argv.shares,
    threshold: Math.min(argv.threshold, argv.shares),
    keySize: argv.keySize
  });

  await fs.mkdir(argv.output, { recursive: true }); // create directory structure
  await Promise.all([
    fs.writeFile(path.join(argv.output, 'id_rsa.pub'), publicKey),
    fs.writeFile(path.join(argv.output, 'id_rsa'), privateKey),
    ...splits.map((split, index) => fs.writeFile(path.join(argv.output, `share-${index}.memo`), split.join(' '))),
  ]);
})();
