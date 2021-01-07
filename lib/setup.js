const childProcess = require('child_process');
const fs = require('fs');
const { maxCharReturn, provingSchemes, backends } = require('./utils/static');

const { spawn } = childProcess;

/**
 * Expected from ZoKrates CLI:
 * -b, --backend <backend>                  Backend to use [default: bellman]  [possible values: bellman, libsnark, ark]
 * -i, --input <FILE>                       Path of the binary [default: out]
 * -p, --proving-key-path <FILE>            Path of the generated proving key file [default: proving.key]
 * -s, --proving-scheme <proving-scheme>    Proving scheme to use in the setup [default: g16]  [possible values: g16, pghr13, gm17]
 * -v, --verification-key-path <FILE>       Path of the generated verification key file [default: verification.key]
 *
 * Takes compiled binary found at `codePath` and outputs verification and proving keys.
 *
 * @example
 * setup('./zok/test_out', './zok/test', 'g16', 'bellman', 'test_vk.key', 'test_pk.key', '/app/stdlib');
 *
 * @param {String} codePath Path to compiled binary.
 * @param {String} [outputPath=./] Directory to output, defaults to current directory.
 * @param {String} [provingScheme=g16] Proving scheme, defaults to g16. Available proving schemes are g16, pghr13, gm17.
 * @param {String} [backend=bellman] Backend, defaults to bellman. Available backends are bellman, libsnark, ark.
 * @param {String} [vkName=verification.key] Name of verification key file, defaults to `verification.key`.
 * @param {String} [pkName=proving.key] Name of proving key file, defaults to `proving.key`.
 * @param {String} [stdlibPath=/app/stdlib] Path to ZoKrates standard library. Defaults to `/app/stdlib`.
 */
async function setup(
  codePath,
  outputPath = './',
  provingScheme = 'g16',
  backend = 'bellman',
  vkName = 'verification.key',
  pkName = 'proving.key',
  stdlibPath = '/app/stdlib',
  options = {},
) {
  const { maxReturn = maxCharReturn, verbose = false } = options;

  if (!fs.existsSync(codePath)) {
    throw new Error('Setup: input file(s) not found.');
  }
  if (codePath.endsWith('.zok') || codePath.endsWith('.ztf')) {
    throw new Error(
      'Setup: cannot take the .zok or .ztf version, use the compiled binary with no extension.',
    );
  }
  if (!fs.existsSync(outputPath) || !fs.lstatSync(outputPath).isDirectory()) {
    throw new Error('Setup: directory to output does not exist or is not a directory.');
  }
  if (!backends.includes(backend)) {
    throw new Error('Setup: backend is not valid.');
  }
  if (!provingSchemes.includes(provingScheme)) {
    throw new Error('Setup: proving scheme is not valid.');
  }
  if (!fs.existsSync(stdlibPath) || !fs.lstatSync(stdlibPath).isDirectory()) {
    throw new Error('Setup: stdlibPath does not exist or is not a directory.');
  }

  // Ensure outputPath ends with /
  const parsedOutputPath = outputPath.endsWith('/') ? outputPath : `${outputPath}/`;

  // Ensure the keys end with .key
  const vkWithKey = vkName.endsWith('.key') ? vkName : `${vkName}.key`;
  const pkWithKey = pkName.endsWith('.key') ? pkName : `${pkName}.key`;

  // FIX: Is stdlib path actually needed here?
  return new Promise((resolve, reject) => {
    const zokrates = spawn(
      '/app/zokrates',
      [
        'setup',
        '-i',
        codePath,
        '-s',
        provingScheme,
        '-b',
        backend,
        '-v',
        `${parsedOutputPath}${vkWithKey}`,
        '-p',
        `${parsedOutputPath}${pkWithKey}`,
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
      reject(new Error(`Setup failed: ${err}`));
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

module.exports = setup;
