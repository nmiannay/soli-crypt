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
 * Returns path of output folder where files will be created in
 * @param {String} inputPath Path to input directory or file
 * @param {String} outputPath Path to output directory or file
 * @param {String} suffix Suffix to append to filename
 * @returns Promise<String || null>
 */
async function getOutputFolderPath(inputPath, outputPath, suffix) {
  return fs.lstat(inputPath).then(d => d.isDirectory() ? outputPath || `${inputPath}.${suffix}` : null);
}

/**
 * Returns path of output file relative to `outputFolderPath'
 * @param {String || null} outputFolderPath Path to output directory
 * @param {String} file current filename
 * @param {Object} options
 * @returns String
 */
function getOutputFilePath(outputFolderPath, file, { suffix, output: outputPath, file: inputPath }) {
  if (outputFolderPath === null) {
    return outputPath || `${file || ''}${suffix}`
  }
  return path.join(outputFolderPath, path.relative(inputPath, file));
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
  getOutputFolderPath,
  getOutputFilePath,
  configParser,
}
