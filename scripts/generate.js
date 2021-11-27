const path = require('path');
const fs = require('fs').promises;
const yargs = require('yargs');
const generateKeys = require('../lib/generateKeys');
const { configParser } = require('../lib/utils');
const { DEFAULT_WORDLIST_PATH } = require('../lib/constants');

const argv = yargs
  .usage('$0\n\nGenerate encryption key pair and memoized share files')
  .option('wordlist', {
    alias: 'w',
    description: 'Path to worldlist used to memoize passphrase',
    type: 'string',
    default: DEFAULT_WORDLIST_PATH,
    coerce: configParser
  })
  .option('shares', {
    alias: 's',
    description: 'Number of n shares that should be created for this secret',
    type: 'number',
    default: 6,
  })
  .option('threshold', {
    alias: 't',
    description: 'Number of t of n distinct share that are required to reconstruct this secret',
    type: 'number',
    default: 5,
  })
  .option('keySize', {
    alias: 'k',
    description: 'Size of randomly generated passphrase',
    type: 'number',
    default: 256,
  })
  .option('output', {
    alias: 'o',
    description: 'Path to store generated files',
    type: 'string',
    default: process.cwd(),
  })
  .help()
  .alias('help', 'h')
  .version(false)
  .strict()
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
})().catch(e => console.error(`[Error] ${e.message}`));
