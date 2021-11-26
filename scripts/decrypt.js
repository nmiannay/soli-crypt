const path = require('path');
const yargs = require('yargs');
const { promises: fs , createReadStream, createWriteStream } = require('fs');
const decrypt = require('../lib/decrypt');
const { DEFAULT_PLAIN_SUFFIX, DEFAULT_WORDS_LIST_PATH } = require('../lib/constants');
const { walk, getOutputFolderPath, getOutputFilePath } = require('../lib/utils');

(async function main() {
  const argv = await yargs
  .option('wordlist', {
    alias: 'w',
    description: 'The path to world list used to memoize passphrase',
    type: 'string',
    default: DEFAULT_WORDS_LIST_PATH,
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
    coerce: async (splits) => await Promise.all(
      splits.map(s => fs.readFile(s).then(buff => buff.toString().split(' ')))
    ),   
  })
  .option('suffix', {
    description: 'The suffix added to encrypted file',
    type: 'string',
    default: DEFAULT_PLAIN_SUFFIX,
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

    await decrypt({
      readStream: createReadStream(file),
      writeStream: createWriteStream(outputPath),
      wordlist: argv.wordlist,
      privateKey: argv['private-key'],
      splits: argv.share,
    });
  });
})().catch(console.error);
