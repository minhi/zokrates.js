const childProcess = require('child_process');
const fs = require('fs');
const { maxCharReturn } = require('./utils/static');

const { spawn } = childProcess;

/**
 * Expected from ZoKrates CLI:
 * -s, --abi_spec <FILE>             Path of the ABI specification [default: abi.json]
 * -a, --arguments <arguments>...    Arguments for the program's main function, when not using ABI encoding. Expects a space-separated list of field elements like `-a 1 2 3`
 * -i, --input <FILE>                Path of the binary [default: out]
 * -o, --output <FILE>               Path of the output file [default: witness]
 *
 * Computes a witness from a binary and abi file.
 *
 * @example
 * computeWitness('./zok/test_out', './zok/test_abi.json', './zok/test', 'test_witness', [5, 25], '/app/stdlib')
 *
 * @param {String} codePathBinary Path to binary file.
 * @param {String} codePathAbi Path to abi file.
 * @param {String} [outputPath=./] Directory to output, defaults to current directory.
 * @param {String} [outputName=witness] Name of witness. Defaults to `witness`.
 * @param {Array} arg Arguments to be passed to compute witness (flag -a).
 * @param {String} [stdlibPath=/app/stdlib] Path to ZoKrates standard library. Defaults to `/app/stdlib`.
 */
async function computeWitness(
  codePathBinary,
  codePathAbi,
  outputPath = './',
  outputName = 'witness',
  args,
  stdlibPath = '/app/stdlib',
  options = {},
) {
  const { maxReturn = maxCharReturn, verbose = false } = options;

  if (!fs.existsSync(codePathBinary) || !fs.existsSync(codePathAbi)) {
    throw new Error('Compute-witness: codePath input file(s) not found.');
  }
  if (codePathBinary.endsWith('.zok') || codePathBinary.endsWith('.ztf')) {
    throw new Error(
      'Compute-witness: cannot take the .zok or .ztf version, use the compiled binary with no extension.',
    );
  }
  if (!fs.existsSync(outputPath) || !fs.lstatSync(outputPath).isDirectory()) {
    throw new Error('Compute-witness: directory to output does not exist or is not a directory.');
  }
  if (!Array.isArray(args)) {
    throw new Error('Compute-witness: Arguments need to be passed as an array.');
  }
  if (!fs.existsSync(stdlibPath) || !fs.lstatSync(stdlibPath).isDirectory()) {
    throw new Error('Compute-witness: stdlibPath does not exist or is not a directory.');
  }

  // Ensure outputPath ends with /
  const parsedOutputPath = outputPath.endsWith('/') ? outputPath : `${outputPath}/`;
  // Adds .json at the end of codePathAbi if necessary
  const parsedCodePathAbi = codePathAbi.endsWith('.json') ? codePathAbi : `${codePathAbi}.json`;

  // FIX: Is stdlib path actually needed here?
  return new Promise((resolve, reject) => {
    const zokrates = spawn(
      '/app/zokrates',
      [
        'compute-witness',
        '-i',
        codePathBinary,
        '-s',
        parsedCodePathAbi,
        '-o',
        `${parsedOutputPath}${outputName}`,
        '-a',
        ...args,
      ],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ZOKRATES_HOME: stdlibPath,
        },
      },
    );

    let output = '';

    zokrates.stdout.on('data', data => {
      if (verbose) {
        output += data.toString('utf8');
        // If the entire output gets too large, just send ...[truncated].
        if (output.length > maxReturn) output = '...[truncated]';
      }
    });

    zokrates.stderr.on('data', err => {
      reject(new Error(`Compute witness failed: ${err}`));
    });

    zokrates.on('close', () => {
      // ZoKrates sometimes outputs error through stdout instead of stderr,
      // so we need to catch those errors manually.
      if (output.includes('panicked')) {
        reject(new Error(output.slice(output.indexOf('panicked'))));
      }
      if (verbose) resolve(output);
      else resolve();
    });
  });
}

module.exports = computeWitness;
