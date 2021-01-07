const childProcess = require('child_process');
const fs = require('fs');
const { maxCharReturn, curves } = require('./utils/static');

const { spawn } = childProcess;

/**
 * Expected from ZoKrates CLI:
 * -s, --abi_spec <FILE>       Path of the ABI specification [default: abi.json]
 * -c, --curve <curve>         Curve to be used in the compilation [default: bn128]  [possible values: bn128, bls12_381, bls12_377, bw6_761]
 * -i, --input <FILE>          Path of the source code
 * -o, --output <FILE>         Path of the output binary [default: out]
 *     --stdlib-path <PATH>    Path to the standard library [env: ZOKRATES_STDLIB=]  [default: /root/.zokrates/stdlib]
 *
 * Compiles `.zok` file found at `codePath` and outputs binary, abi and ztf at `outputPath` with name `outputName` and `abiName`, respectively.
 *
 * @example
 * compile('./zok/test.zok', './zok/test', 'test_out', 'test_abi.json', 'bn128', '/app/stdlib');
 *
 * @param {String} codePath Path to `.zok` file to compile.
 * @param {String} [outputPath=./] Directory to output, defaults to current directory.
 * @param {String} [outputName=out] Name of output file. Defaults to `out`.
 * @param {String} [abiName=abi.json] Name of abi file. Defaults to `abi.json`.
 * @param {String} [curve=bn128] Name of cruve to be used in the compilation. Defaults to `bn128`.
 * @param {String} [stdlibPath=/app/stdlib] Path to ZoKrates standard library. Defaults to `/app/stdlib`.
 */
async function compile(
  codePath,
  outputPath = './',
  outputName = 'out',
  abiName = 'abi.json',
  curve = 'bn128',
  stdlibPath = '/app/stdlib',
  options = {},
) {
  const { maxReturn = maxCharReturn, verbose = false } = options;

  if (!fs.existsSync(codePath)) {
    throw new Error('Compile: input file(s) not found.');
  }
  if (!fs.existsSync(outputPath) || !fs.lstatSync(outputPath).isDirectory()) {
    throw new Error('Compile: directory to output does not exist or is not a directory.');
  }
  if (!curves.includes(curve)) {
    throw new Error('Compile: curve is not valid.');
  }
  if (!fs.existsSync(stdlibPath) || !fs.lstatSync(stdlibPath).isDirectory()) {
    throw new Error('Compile: stdlibPath does not exist or is not a directory.');
  }

  // Adds .json at the end of abiName if necessary
  const parsedAbiName = abiName.endsWith('.json') ? abiName : `${abiName}.json`;
  // Trims .zok from the end of outputName if necessary
  const parsedOutputName = outputName.endsWith('.zok') ? outputName.slice(0, -4) : outputName;
  // Ensure outPath ends with /
  const parsedOutputPath = outputPath.endsWith('/') ? outputPath : `${outputPath}/`;

  return new Promise((resolve, reject) => {
    const zokrates = spawn(
      '/app/zokrates',
      [
        'compile',
        '-i',
        codePath,
        '-o',
        `${parsedOutputPath}${parsedOutputName}`,
        '-s',
        `${parsedOutputPath}${parsedAbiName}`,
        '-c',
        curve,
        '--stdlib-path',
        stdlibPath,
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
      reject(new Error(`Compile failed: ${err}`));
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

module.exports = compile;
