const yargs = require('yargs');
const { promises: fs , createReadStream, createWriteStream } = require('fs');
const { Readable } = require("stream");
const { HEADER_LENGTH } = require('../lib/constants');
const encrypt = require('../lib/encrypt');

(async function main() {
  const argv = await yargs
  .option('public-key', {
    alias: 'k',
    description: 'The path to public key',
    type: 'string',
    required: true,
    coerce: async (path) => await fs.readFile(path),
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

  const outputPath = argv.output || `${argv.file || ''}.crypted`;
  const readStream = argv._[0] ? Readable.from([argv._[0]]) : createReadStream(argv.file);
  const writeStream = createWriteStream(outputPath, { start: HEADER_LENGTH });
  const header = await encrypt(readStream, writeStream, argv['public-key']);
  const fd = await fs.open(outputPath, 'r+');

  await fd.write(header, 0);
  await fd.close();
})();
