const fs = require('fs');
const exportVerifier = require('../export-verifier');
const deleteFile = require('../utils/utils');
const { curves, provingSchemes, backends, solidityAbis } = require('../utils/static');

// TODO: add more tests for invalid inputs
// TODO: add tests for proving schemes with different curves
// TODO: add tests for different backends
// TODO: add tests for different solidity ABIs

it('should throw an error if file path does not exist', async () => {
  expect.assertions(1);
  await expect(exportVerifier('./foo', './zok/test')).rejects.toThrow(Error);
});

it('should throw an error if input file does not end with .key', async () => {
  expect.assertions(1);
  await expect(exportVerifier('./zok/test_bellman_bn128_g16_vk', './zok/test')).rejects.toThrow(
    Error,
  );
});

it('should create the output file for bellman bn128 g16', async () => {
  await exportVerifier(
    './zok/test_bellman_bn128_g16_vk.key',
    './zok/test',
    'Verifier_test_bellman_bn128_g16_v1_.sol',
    'g16',
    'bn128',
    'v1',
    '/app/stdlib',
  );
  expect(fs.existsSync('./zok/test/Verifier_test_bellman_bn128_g16_v1_.sol')).toBe(true);
  deleteFile('./zok/test/Verifier_test_bellman_bn128_g16_v1_.sol');
});

it('should return a string given a verbose flag', async () => {
  const output = await exportVerifier(
    './zok/test_bellman_bn128_g16_vk.key',
    './zok/test',
    'Verifier_test_bellman_bn128_g16_v1_.sol',
    'g16',
    'bn128',
    'v1',
    '/app/stdlib',
    {
      verbose: true,
    },
  );
  deleteFile('./zok/test/Verifier_test_bellman_bn128_g16_v1_.sol');
  expect(typeof output).toBe('string');
});
