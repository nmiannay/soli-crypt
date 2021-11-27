const path = require('path');
const yargs = require('yargs');
const { promises: fs , createReadStream, createWriteStream } = require('fs');
const decrypt = require('../lib/decrypt');
const { DEFAULT_PLAIN_SUFFIX, DEFAULT_WORDS_LIST_PATH } = require('../lib/constants');
const { walk, getOutputFilePath, configParser } = require('../lib/utils');

(async function main() {
  const argv = await yargs
  .option('wordlist', {
    alias: 'w',
    description: 'The path to world list used to memoize passphrase',
    type: 'string',
    default: DEFAULT_WORDS_LIST_PATH,
    coerce: configParser,
  })
  .option('private-key', {
    alias: 'k',
    description: 'The path to private key',
    type: 'string',
    required: true,
    coerce: fs.readFile,
  })
  .option('file', {
    alias: 'f',
    description: 'Paths to file or folder to encrypt',
    type: 'array',
    required: true,
  })
  .option('output', {
    alias: 'o',
    description: 'The path to store generated file',
    type: 'string',
  })
  .option('share', {
    alias: '-s',
    description: 'Paths to share file',
    type: 'array',
    required: true,
    coerce: async (splits = []) => Promise.all(
      splits.map(s => fs.readFile(s).then(buff => buff.toString().split(' ')))
    ),   
  })
  .option('suffix', {
    description: 'The suffix added to encrypted file',
    type: 'string',
    default: DEFAULT_PLAIN_SUFFIX,
  })
  .option('config', {
    alias: 'c',
    description: 'The path to config file',
    config: true,
    configParser: configPath => configParser(configPath).decrypt || {}
  })
  .help()
  .alias('help', 'h')
  .argv;

  const outputIsDir = argv.output && await fs.lstat(argv.output).then(d => d.isDirectory()).catch(() => false);

  return Promise.all(argv.file.map(async (fileOrDirectory) => {
    const currentIsDir = await fs.lstat(fileOrDirectory).then(d => d.isDirectory())

    return walk(fileOrDirectory, async (file) => {
      const outputPath = getOutputFilePath(argv.output, file, outputIsDir || currentIsDir, argv.suffix);

      if (argv.output) { // create directory structure
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
      }

      return decrypt({
        readStream: createReadStream(file),
        writeStream: createWriteStream(outputPath),
        wordlist: argv.wordlist,
        privateKey: argv['private-key'],
        splits: argv.share,
      });
    });
  }));
})().catch(console.error);
