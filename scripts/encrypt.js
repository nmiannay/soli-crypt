const yargs = require('yargs');
const path = require('path');
const { promises: fs , createReadStream, createWriteStream } = require('fs');
const { HEADER_LENGTH, DEFAULT_ENCRYPT_SUFFIX } = require('../lib/constants');
const encrypt = require('../lib/encrypt');
const { walk, getOutputFilePath, configParser } = require('../lib/utils');

(async function main() {
  const argv = await yargs
  .usage('$0 -k <public-key> <file> [...<file>]\n\nEncrypt a file or folder')
  .option('public-key', {
    alias: 'k',
    description: 'The path to public key',
    type: 'string',
    required: true,
    demandOption: true,
    coerce: fs.readFile,
  })
  .option('output', {
    alias: 'o',
    description: 'The path to store generated file',
    type: 'string',
    //must be a folder or not existing if file.length > 1
  })
  .option('suffix', {
    description: 'The suffix added to encrypted file',
    type: 'string',
    default: DEFAULT_ENCRYPT_SUFFIX,
  })
  .option('config', {
    alias: 'c',
    description: 'The path to config file',
    config: true,
    configParser: configPath => configParser(configPath).encrypt || {}
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
  .argv;

  if (!process.stdin.isTTY) {
    await fs.mkdir(path.dirname(argv.output), { recursive: true }); // create directory structure

    return encrypt(
      process.stdin,
      createWriteStream(argv.output, { start: HEADER_LENGTH }),
      argv['public-key']
    );
  }

  const outputIsDir = argv.output && await fs.lstat(argv.output).then(d => d.isDirectory()).catch(() => false);

  return Promise.all(argv._.map(async (fileOrDirectory) => {
    const currentIsDir = await fs.lstat(fileOrDirectory).then(d => d.isDirectory())

    return walk(fileOrDirectory, async (file) => {
      const outputPath = getOutputFilePath(argv.output, file, outputIsDir || currentIsDir, argv.suffix);

      if (argv.output) { // create directory structure
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
      }

      return encrypt(
        createReadStream(file),
        createWriteStream(outputPath, { start: HEADER_LENGTH }),
        argv['public-key']
      );
    });
  }));
})().catch(e => console.error(`[Error] ${e.message}`));
