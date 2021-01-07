const childProcess = require('child_process');
const fs = require('fs');
const { maxCharReturn, provingSchemes, backends } = require('./utils/static');

const { spawn } = childProcess;

/**
 * Expected from ZoKrates CLI:
 * -b, --backend <backend>                  Backend to use [default: bellman]  [possible values: bellman, libsnark, ark]
 * -i, --input <FILE>                       Path of the binary [default: out]
 * -j, --proof-path <FILE>                  Path of the JSON proof file [default: proof.json]
 * -p, --proving-key-path <FILE>            Path of the proving key file [default: proving.key]
 * -s, --proving-scheme <proving-scheme>    Proving scheme to use to generate the proof [default: g16]  [possible values: g16, pghr13, gm17]
 * -w, --witness <FILE>                     Path of the witness file [default: witness]
 *
 * Takes a proving key,a witness and a compiled binary file and outputs a proof.
 *
 * @example
 * generateProof('./zok/test_out', './zok/test_pk.key', './zok/test_witness', './zok/test', 'test_proof.json', 'g16', 'bellman', '/app/stdlib')
 *
 * @param {String} codePath Path to compiled binary.
 * @param {String} provingKeyPath Path to proving key.
 * @param {String} witnessPath Path to witness.
 * @param {String} [outputPath=./] Directory to output, defaults to current directory.
 * @param {String} [outputName=proof.json] Name of proof. Defaults to `proof.json`.
 * @param {String} [provingScheme=g16] Proving scheme, defaults to g16. Available proving schemes are g16, pghr13, gm17.
 * @param {String} [backend=bellman] Backend, defaults to bellman. Available backends are bellman, libsnark, ark.
 * @param {String} [stdlibPath=/app/stdlib] Path to ZoKrates standard library. Defaults to `/app/stdlib`.
 */
async function generateProof(
  codePath,
  provingKeyPath,
  witnessPath,
  outputPath = './',
  outputName = 'proof.json',
  provingScheme = 'g16',
  backend = 'bellman',
  stdlibPath = '/app/stdlib',
  options = {},
) {
  const { maxReturn = maxCharReturn, verbose = false } = options;

  if (!fs.existsSync(codePath) || !fs.existsSync(provingKeyPath) || !fs.existsSync(witnessPath)) {
    throw new Error('Generate-proof: input file(s) not found.');
  }
  if (codePath.endsWith('.zok') || codePath.endsWith('.ztf')) {
    throw new Error(
      'Generate-proof: cannot take the .zok or .ztf version, use the compiled binary with no extension.',
    );
  }
  if (!provingKeyPath.endsWith('.key')) {
    throw new Error('Generate-proof: a .key file expected.');
  }
  if (!fs.existsSync(outputPath) || !fs.lstatSync(outputPath).isDirectory()) {
    throw new Error('Generate-proof: directory to output does not exist or is not a directory.');
  }
  if (!backends.includes(backend)) {
    throw new Error('Generate-proof: backend is not valid.');
  }
  if (!provingSchemes.includes(provingScheme)) {
    throw new Error('Generate-proof: proving scheme is not valid.');
  }
  if (!fs.existsSync(stdlibPath) || !fs.lstatSync(stdlibPath).isDirectory()) {
    throw new Error('Generate-proof: stdlibPath does not exist or is not a directory.');
  }

  // Ensure outputPath ends with /
  const parsedOutputPath = outputPath.endsWith('/') ? outputPath : `${outputPath}/`;
  // Adds .json at the end of outputName if necessary
  const parsedoutputName = outputName.endsWith('.json') ? outputName : `${outputName}.json`;

  return new Promise((resolve, reject) => {
    const zokrates = spawn(
      '/app/zokrates',
      [
        'generate-proof',
        '-i',
        codePath,
        '-p',
        provingKeyPath,
        '-w',
        witnessPath,
        '-j',
        `${parsedOutputPath}${parsedoutputName}`,
        '-s',
        provingScheme,
        '-b',
        backend,
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
      reject(new Error(`Generate proof failed: ${err}`));
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

module.exports = generateProof;
