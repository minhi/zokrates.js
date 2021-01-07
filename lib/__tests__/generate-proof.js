const fs = require('fs');
const generateProof = require('../generate-proof');
const deleteFile = require('../utils/utils');
const { curves, provingSchemes, backends, solidityAbis } = require('../utils/static');

// TODO: add more tests for invalid inputs and default inputs
// TODO: add tests for proving schemes with different curves
// TODO: add tests for different backends

it('should throw an error if code path, proving key path or witness path does not exist', async () => {
  expect.assertions(3);
  await expect(
    generateProof('./foo', './zok/test_bellman_bn128_g16_pk.key', './zok/test_bn128_witness'),
  ).rejects.toThrow(Error);
  await expect(
    generateProof('./zok/test_bn128_out', './foo', './zok/test_bn128_witness'),
  ).rejects.toThrow(Error);
  await expect(
    generateProof('./zok/test_bn128_out', './zok/test_bellman_bn128_g16_pk.key', './foo'),
  ).rejects.toThrow(Error);
});

it('should throw an error if code path ends with ".code"', async () => {
  expect.assertions(1);
  await expect(
    generateProof(
      './zok/test.code',
      './zok/test_bellman_bn128_g16_pk.key',
      './zok/test_bn128_witness',
    ),
  ).rejects.toThrow(Error);
});

it('should create the output file', async () => {
  await generateProof(
    './zok/test_bn128_out',
    './zok/test_bellman_bn128_g16_pk.key',
    './zok/test_bn128_witness',
    './zok/test',
    'test_bellman_bn128_g16_proof.json',
    'g16',
    'bellman',
    '/app/stdlib',
  );
  expect(fs.existsSync('./zok/test/test_bellman_bn128_g16_proof.json')).toBe(true);
  deleteFile('./zok/test/test_bellman_bn128_g16_proof.json');
});

it('should return a string given a verbose flag', async () => {
  const output = await generateProof(
    './zok/test_bn128_out',
    './zok/test_bellman_bn128_g16_pk.key',
    './zok/test_bn128_witness',
    './zok/test',
    'test_bellman_bn128_g16_proof.json',
    'g16',
    'bellman',
    '/app/stdlib',
    {
      verbose: true,
    },
  );
  deleteFile('./zok/test/test_bellman_bn128_g16_proof.json');
  expect(typeof output).toBe('string');
});
