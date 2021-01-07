const fs = require('fs');
const setup = require('../setup');
const deleteFile = require('../utils/utils');
const { curves, provingSchemes, backends, solidityAbis } = require('../utils/static');

// TODO: add more tests for invalid inputs
// TODO: add tests for proving schemes with different curves
// TODO: add tests for different backends

it('should throw an error if file path does not exist', async () => {
  expect.assertions(1);
  await expect(setup('./foo', './zok/test')).rejects.toThrow(Error);
});

it('should throw an error if input file ends with .zok', async () => {
  expect.assertions(1);
  await expect(setup('./zok/test.zok', './zok/test')).rejects.toThrow(Error);
});

it('should create the output files for g16, bellman, bn128', async () => {
  await setup(
    './zok/test_bn128_out',
    './zok/test',
    'g16',
    'bellman',
    'test_bellman_bn128_g16_vk.key',
    'test_bellman_bn128_g16_pk.key',
    '/app/stdlib',
  );

  expect(fs.existsSync('./zok/test/test_bellman_bn128_g16_vk.key')).toBe(true);
  expect(fs.existsSync('./zok/test/test_bellman_bn128_g16_pk.key')).toBe(true);

  deleteFile('./zok/test/test_bellman_bn128_g16_vk.key');
  deleteFile('./zok/test/test_bellman_bn128_g16_pk.key');
});

/*
it('should allow g16, pghr13, gm17 proving schemes', async () => {
  expect.assertions(3);
  const basePath = './code/test/';
  const vkPath = `${basePath}test-vk.key`;
  const pkPath = `${basePath}test-pk.key`;

  const provingSchemes = ['g16', 'pghr13', 'gm17'];
  // eslint-disable-next-line no-restricted-syntax
  for (const schemes of provingSchemes) {
    // eslint-disable-next-line no-await-in-loop
    await setup('./code/test-compiled', './code/test/', schemes, 'test-vk', 'test-pk');
    expect(fs.existsSync(vkPath) && fs.existsSync(pkPath)).toBe(true);
    deleteFile('./code/test/test-vk.key');
    deleteFile('./code/test/test-pk.key');
  }
});
*/

it('should return a string given a verbose flag', async () => {
  const output = await setup(
    './zok/test_bn128_out',
    './zok/test',
    'g16',
    'bellman',
    'test_bn128_vk.key',
    'test_bn128_pk.key',
    '/app/stdlib',
    {
      verbose: true,
    },
  );

  deleteFile('./zok/test/test_bn128_vk.key');
  deleteFile('./zok/test/test_bn128_pk.key');

  expect(typeof output).toBe('string');
});
