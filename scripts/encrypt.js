const encrypt = require('../lib/encrypt');
const yargs = require('yargs');
const fs = require('fs').promises;

const argv = yargs
  .option('public-key', {
    alias: 'k',
    description: 'The path to public key',
    type: 'string',
    required: true
  })
  .option('file', {
    alias: 'f',
    description: 'The path to file to encrypt',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    description: 'The path to store generated file',
    type: 'string',
  })
  .help()
  .alias('help', 'h')
  .argv;

(async function main() {
  const publicKey = await fs.readFile(argv['public-key']);
  const plainData = argv._[0] || await fs.readFile(argv.file);
  const encryptedData = encrypt(plainData, publicKey);
  const outputPath = (argv.output || `${argv.file || ''}.crypted`);

  await fs.writeFile(outputPath, encryptedData);
})();
