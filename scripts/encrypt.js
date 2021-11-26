const yargs = require('yargs');
const path = require('path');
const { promises: fs , createReadStream, createWriteStream } = require('fs');
const { HEADER_LENGTH, DEFAULT_ENCRYPT_SUFFIX } = require('../lib/constants');
const encrypt = require('../lib/encrypt');
const { walk, getOutputFolderPath, getOutputFilePath } = require('../lib/utils');

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
    description: 'The path to file or folder to encrypt',
    type: 'string',
  })
  .option('output', {
    alias: 'o',
    description: 'The path to store generated file',
    type: 'string',
  })
  .option('suffix', {
    description: 'The suffix added to encrypted file',
    type: 'string',
    default: DEFAULT_ENCRYPT_SUFFIX,
  })
  .help()
  .alias('help', 'h')
  .argv;

  const outputFolderPath = await getOutputFolderPath(argv.file, argv.output, argv.suffix);

  await walk(argv.file, async (file) => {
    const outputPath = getOutputFilePath(outputFolderPath, file, argv);

    if (outputFolderPath !== null) { // create directory structure
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
    }

    const readStream = createReadStream(file);
    const writeStream = createWriteStream(outputPath, { start: HEADER_LENGTH });
    const header = await encrypt(readStream, writeStream, argv['public-key']);
    const fd = await fs.open(outputPath, 'r+');

    await fd.write(header, 0);
    await fd.close();
  });
})();
