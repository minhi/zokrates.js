const fs = require('fs');
const computeWitness = require('../compute-witness');
const deleteFile = require('../utils/utils');
const { curves, provingSchemes, backends, solidityAbis } = require('../utils/static');

// TODO: add more tests for invalid inputs and default inputs
// TODO: add tests for proving schemes with different curves
// TODO: add tests for different backends

it('should throw an error if file path does not exists', async () => {
  expect.assertions(2);
  await expect(computeWitness('./foo', './zok/test_bn128_abi.json')).rejects.toThrow(Error);
  await expect(computeWitness('./zok/test_bn128_out', './foo')).rejects.toThrow(Error);
});

it('should throw an error if input file ends with .zok', async () => {
  expect.assertions(1);
  await expect(computeWitness('./zok/test.zok', './zok/test')).rejects.toThrow(Error);
});

it('should create the output file', async () => {
  await computeWitness(
    './zok/test_bn128_out',
    './zok/test_bn128_abi.json',
    './zok/test',
    'test_bn128_witness',
    [5, 25],
    '/app/stdlib',
  );
  expect(fs.existsSync('./zok/test/test_bn128_witness')).toBe(true);
  deleteFile('./zok/test/test_bn128_witness');
});

it('should return a string given a verbose flag', async () => {
  const output = await computeWitness(
    './zok/test_bn128_out',
    './zok/test_bn128_abi.json',
    './zok/test',
    'test_bn128_witness',
    [5, 25],
    '/app/stdlib',
    {
      verbose: true,
    },
  );
  deleteFile('./zok/test/test_bn128_witness');
  expect(typeof output).toBe('string');
});
