import { utils } from 'umi';
import { transform } from '@babel/core';
import { join, basename } from 'path';
import { readdirSync, readFileSync, existsSync } from 'fs';

const { winPath } = utils;

const fixtures = join(winPath(__dirname), 'fixtures');

function testTransform(dir) {
  const filename = existsSync(join(fixtures, dir, 'origin.js'))
    ? join(fixtures, dir, 'origin.js')
    : join(fixtures, dir, 'origin.tsx');
  const origin = readFileSync(filename, 'utf-8');
  const { code } = transform(origin, {
    filename: `/tmp/pages/${basename(filename)}`,
    presets: [
      require.resolve('@umijs/babel-preset-umi/app.js'),
      require.resolve('@babel/preset-typescript'),
    ],
    plugins: [
      [
        require.resolve('./index'),
        {
          doTransform() {
            return true;
          },
        },
      ],
    ],
  });
  const expectedFile = existsSync(join(fixtures, dir, 'expected.js'))
    ? join(fixtures, dir, 'expected.js')
    : join(fixtures, dir, 'expected.tsx');
  const expected = readFileSync(expectedFile, 'utf-8');
  const { code: expectCode } = transform(expected, {
    filename: `/tmp/pages/${basename(filename)}`,
    presets: [
      require.resolve('@umijs/babel-preset-umi/app.js'),
      require.resolve('@babel/preset-typescript'),
    ],
  });
  // Deal with the problem of babel
  const replaceCode = (res: string) =>
    res
      .trim()
      .replace(/[A-Z]:/g, '')
      .replace(/\/\*#__PURE__\*\//gm, '');

  // Special for window, remove the drive letter, in fact, the performance is normal, but in order to ensure that the test passes
  expect(replaceCode(code)).toEqual(replaceCode(expectCode));
}

readdirSync(fixtures).forEach(dir => {
  if (dir.charAt(0) !== '.') {
    const fn = dir.endsWith('-only') ? test.only : test;
    fn(dir, () => {
      testTransform(dir);
    });
  }
});
