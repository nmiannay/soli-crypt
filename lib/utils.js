const path = require('path');
const { promises: fs, readFileSync } = require('fs');

/**
 * Walks through directory structure and execute `cb' function on every file
 * @param {String} dir directory to run through
 * @param {function} cb callback function to execute on each file
 * @returns String
 */
async function walk(pathName, cb) {
  const stats = await fs.lstat(pathName);

  if (stats.isDirectory()) {
    const files = await fs.readdir(pathName);

    return Promise.all(
      files.map(file => walk(path.join(pathName, file), cb))
    );
  } else if (stats.isFile()) {
    return cb(pathName);
  }
}

/**
 * Returns path of output file
 * @param {String || undefined} output Path to output file or directory
 * @param {String} file Current filename
 * @param {Boolean} isDir Is output file will placed to a directory or just renamed
 * @param {String} suffix Suffix to append to filename
 * @returns String
 */
function getOutputFilePath(output, file, isDir, suffix) {
  if (!output) {
    return `${file}${suffix}`;
  } else if (isDir) {
    return path.join(output, file);
  }
  return output;
}


/**
 * Returns JSON parsed content from file
 * @param {String} configPath File to parse
 * @returns Object
 */
function configParser(configPath) {
  return JSON.parse(readFileSync(path.resolve(process.cwd(), configPath), 'utf-8'));
}

module.exports = {
  walk,
  getOutputFilePath,
  configParser,
}
