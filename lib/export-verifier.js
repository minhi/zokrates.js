const childProcess = require('child_process');
const fs = require('fs');
const { maxCharReturn, curves, provingSchemes, solidityAbis } = require('./utils/static');

const { spawn } = childProcess;

/**
 * Expected from ZoKrates CLI:
 * -c, --curve <curve>                      Curve to be used to export the verifier [default: bn128]  [possible values: bn128, bls12_381, bls12_377, bw6_761]
 * -i, --input <FILE>                       Path of the verifier [default: verification.key]
 * -o, --output <FILE>                      Path of the output file [default: verifier.sol]
 * -s, --proving-scheme <proving-scheme>    Proving scheme to use to export the verifier [default: g16]  [possible values: g16, pghr13, gm17]
 * -a, --solidity-abi <solidity-abi>        Flag for setting the version of the ABI Encoder used in the contract [default: v1]  [possible values: v1, v2]
 *
 * Takes the verification key and outputs a Solidity verifier smart contract.
 *
 * @example
 * exportVerifier('./zok/test_vk.key', './zok/test', 'TestVerifier.sol', 'g16', 'bn128', 'v1', '/app/stdlib')
 *
 * @param {String} codePath Path to verification key.
 * @param {String} [outputPath=./] Directory to output, defaults to current directory.
 * @param {String} [outputName=Verifier.sol] Name of Solidity verifier smart contract. Defaults to `Verifier.sol`.
 * @param {String} [provingScheme=g16] Proving scheme, defaults to g16. Available proving schemes are g16, pghr13, gm17.
 * @param {String} [curve=bn128] Name of cruve to be used in the compilation. Defaults to `bn128`.
 * @param {String} [solidityAbi=v1] Version of the ABI encoder used in the contract. Defaults to `v1`. Available v1, v2.
 * @param {String} [stdlibPath=/app/stdlib] Path to ZoKrates standard library. Defaults to `/app/stdlib`.
 */
async function exportVerifier(
  codePath,
  outputPath = './',
  outputName = 'Verifier.sol',
  provingScheme = 'g16',
  curve = 'bn128',
  solidityAbi = 'v1',
  stdlibPath = '/app/stdlib',
  options = {},
) {
  const { maxReturn = maxCharReturn, verbose = false } = options;

  if (!fs.existsSync(codePath)) {
    throw new Error('Export-verifier: input file(s) not found.');
  }
  if (!codePath.endsWith('.key')) {
    throw new Error('Export-verifier: a .key file expected.');
  }
  if (!fs.existsSync(outputPath) || !fs.lstatSync(outputPath).isDirectory()) {
    throw new Error('Export-verifier: directory to output does not exist or is not a directory.');
  }
  if (!curves.includes(curve)) {
    throw new Error('Export-verifier: curve is not valid.');
  }
  if (!provingSchemes.includes(provingScheme)) {
    throw new Error('Export-verifier: proving scheme is not valid.');
  }
  if (!solidityAbis.includes(solidityAbi)) {
    throw new Error('Export-verifier: solidity ABI is not valid.');
  }
  if (!fs.existsSync(stdlibPath) || !fs.lstatSync(stdlibPath).isDirectory()) {
    throw new Error('Export-verifier: stdlibPath does not exist or is not a directory.');
  }

  // Ensure outputPath ends with /
  const parsedOutputPath = outputPath.endsWith('/') ? outputPath : `${outputPath}/`;

  // Ensure the verifier smart contract ends with .sol
  const outputWithSol = outputName.endsWith('.sol') ? outputName : `${outputName}.sol`;

  // FIX: Is stdlib path actually needed here?
  return new Promise((resolve, reject) => {
    const zokrates = spawn(
      '/app/zokrates',
      [
        'export-verifier',
        '-i',
        codePath,
        '-o',
        `${parsedOutputPath}${outputWithSol}`,
        '-s',
        provingScheme,
        '-c',
        curve,
        '-a',
        solidityAbi,
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
      reject(new Error(`Export verifier failed: ${err}`));
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

module.exports = exportVerifier;
