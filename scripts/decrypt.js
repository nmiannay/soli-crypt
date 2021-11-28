const path = require('path');
const yargs = require('yargs');
const { promises: fs , createReadStream, createWriteStream } = require('fs');
const decrypt = require('../lib/decrypt');
const { DEFAULT_PLAIN_SUFFIX, DEFAULT_WORDLIST_PATH } = require('../lib/constants');
const { walk, getOutputFilePath, configParser } = require('../lib/utils');

(async function main() {
  const argv = await yargs
  .usage('$0 -k <private-key> -s <memo-1> -s <memo-2> <file> [...<file>]\n\nDecrypt a file or folder')
  .option('private-key', {
    alias: 'k',
    description: 'Path to private key',
    type: 'string',
    required: true,
    demandOption: true,
    coerce: async (key) => key ? fs.readFile(key).catch(err => { throw new Error(`Unable to open private key.\n${err.message}`); }) : key,
  })
  .option('share', {
    alias: 's',
    description: 'Paths to share file',
    type: 'array',
    required: true,
    demandOption: true,
    coerce: async (splits = []) => Promise.all(
      splits.map(s => fs.readFile(s).then(buff => buff.toString().split(' ')))
    ),   
  })
  .option('output', {
    alias: 'o',
    description: 'Path to store generated file',
    type: 'string',
  })
  .option('suffix', {
    description: 'Suffix added to decrypted file',
    type: 'string',
    default: DEFAULT_PLAIN_SUFFIX,
  })
  .option('wordlist', {
    alias: 'w',
    description: 'Path to worldlist used to memoize passphrase',
    type: 'string',
    default: DEFAULT_WORDLIST_PATH,
    coerce: configParser,
  })
  .option('config', {
    alias: 'c',
    description: 'Path to config file',
    config: true,
    configParser: configPath => configParser(configPath).decrypt || {}
  })
  .help()
  .alias('help', 'h')
  .version(false)
  .strictOptions()
  .check(async (argv) => {
    if (!argv._.length && process.stdin.isTTY) {
      throw new Error('You must give at least 1 file');
    } else if (!process.stdin.isTTY && !await fs.lstat(argv.output).then(d => d.isFile()).catch((e) => e.code === 'ENOENT')) {
      throw new Error('Output must be a file when used with stdin');
    }
    return true;
  })
  .argv

  if (!process.stdin.isTTY) {
    await fs.mkdir(path.dirname(argv.output), { recursive: true }); // create directory structure

    return decrypt({
      readStream: process.stdin,
      writeStream: createWriteStream(argv.output),
      wordlist: argv.wordlist,
      privateKey: argv['private-key'],
      splits: argv.share,
    });
  }

  const outputIsDir = argv.output && await fs.lstat(argv.output).then(d => d.isDirectory()).catch(() => false);

  return Promise.all(argv._.map(async (fileOrDirectory) => {
    const currentIsDir = await fs.lstat(fileOrDirectory).then(d => d.isDirectory())

    return walk(fileOrDirectory, async (file) => {
      const outputPath = getOutputFilePath(
        argv.output,
        currentIsDir ? path.relative(fileOrDirectory, file) : file,
        outputIsDir || currentIsDir,
        argv.suffix
      );

      console.log(`Decrypting file ${file} ... ${outputPath}`);
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
})().catch(e => console.error(`[Error] ${e.message}`));
