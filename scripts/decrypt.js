const decrypt = require('../lib/decrypt');
const yargs = require('yargs');
const { promises: fs , createReadStream, createWriteStream } = require('fs');

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
  const readStream = argv._[0] ? Readable.from([argv._[0]]) : createReadStream(argv.file);
  const outputPath = (argv.output || `${argv.file || ''}.plain`);
  const writeStream = createWriteStream(outputPath);
  const splits = await Promise.all(
    argv.share.map(s => fs.readFile(s).then(buff => buff.toString().split(' ')))
  );

  await decrypt(
    readStream,
    writeStream,
    {
      wordlist: require(argv.wordlist),
      privateKey,
      splits,
    }
  );
})();
