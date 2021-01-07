const fs = require('fs');
const compile = require('../compile');
const deleteFile = require('../utils/utils');
const { curves, provingSchemes, backends, solidityAbis } = require('../utils/static');

// TODO: add more tests for invalid inputs and default inputs

it('should throw an error if file path does not exist', async () => {
  expect.assertions(1);
  await expect(compile('./foo', './zok/test')).rejects.toThrow(Error);
});

it('should throw an error if file type is incorrect', async () => {
  expect.assertions(1);
  await expect(compile('./zok/test.code', './zok/test')).rejects.toThrow(Error);
});

it('should create the compiled files for supported curves', async () => {
  for (const curve of curves) {
    await compile(
      './zok/test.zok',
      './zok/test',
      `test_${curve}_out`,
      `test_${curve}_abi.json`,
      curve,
      '/app/stdlib',
    );
    expect(fs.existsSync(`./zok/test/test_${curve}_out`)).toBe(true);
    expect(fs.existsSync(`./zok/test/test_${curve}_out.ztf`)).toBe(true);
    expect(fs.existsSync(`./zok/test/test_${curve}_abi.json`)).toBe(true);

    deleteFile(`./zok/test/test_${curve}_out`);
    deleteFile(`./zok/test/test_${curve}_out.ztf`);
    deleteFile(`./zok/test/test_${curve}_abi.json`);
  }
});

it('should return a string given a verbose flag', async () => {
  const output = await compile(
    './zok/test.zok',
    './zok/test',
    'test_out',
    'test_abi.json',
    'bn128',
    '/app/stdlib',
    {
      verbose: true,
    },
  );

  deleteFile('./zok/test/test_out');
  deleteFile('./zok/test/test_out.ztf');
  deleteFile('./zok/test/test_abi.json');

  expect(typeof output).toBe('string');
});
