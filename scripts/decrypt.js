const decrypt = require('../lib/decrypt');
const yargs = require('yargs');
const { promises: fs , createReadStream, createWriteStream } = require('fs');

(async function main() {
  const argv = await yargs
  .option('wordlist', {
    alias: 'w',
    description: 'The path to world list used to memoize passphrase',
    type: 'string',
    default: '../words.json',
    coerce: require,
  })
  .option('private-key', {
    alias: 'k',
    description: 'The path to private key',
    type: 'string',
    required: true,
    coerce: async (path) => await fs.readFile(path),
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

  const outputPath = (argv.output || `${argv.file || ''}.plain`);
  const readStream = argv._[0] ? Readable.from([argv._[0]]) : createReadStream(argv.file);
  const writeStream = createWriteStream(outputPath);
  const splits = await Promise.all(
    argv.share.map(s => fs.readFile(s).then(buff => buff.toString().split(' ')))
  );

  await decrypt(
    readStream,
    writeStream,
    {
      wordlist: argv.wordlist,
      privateKey: argv['private-key'],
      splits,
    }
  );
})();
