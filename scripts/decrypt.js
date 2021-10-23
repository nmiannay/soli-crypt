const decrypt = require('../lib/decrypt');
const yargs = require('yargs');
const fs = require('fs').promises;

const argv = yargs
  .option('wordlist', {
    alias: 'w',
    description: 'The path to world list used to memoize passphrase',
    type: 'string',
    default: '../words.json',
  })
  .option('private-key', {
    alias: 'k',
    description: 'The path to private key',
    type: 'string',
    required: true
  })
  .option('file', {
    alias: 'f',
    description: 'The path to file to decrypt',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    description: 'The path to store generated file',
    type: 'string',
  })
  .option('share', {
    alias: '-s',
    description: 'The path to share file',
    type: 'array',
    required: true,
  })
  .help()
  .alias('help', 'h')
  .argv;

(async function main() {
  const privateKey = await fs.readFile(argv['private-key']);
  const encryptedData = argv._[0] || await fs.readFile(argv.file);
  const outputPath = (argv.output || `${argv.file || ''}.plain`);
  const splits = await Promise.all(
    argv.share.map(s => fs.readFile(s).then(buff => buff.toString().split(' ')))
  );
  const plainData = decrypt(
    encryptedData,
    {
      wordlist: require(argv.wordlist),
      privateKey,
      splits,
    }
  );

  await fs.writeFile(outputPath, plainData);
})();
