import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import haveRootBinding from '@machinaai/block-sdk/lib/sdk/haveRootBinding';
import { findJS } from '@machinaai/block-sdk';
import { utils } from 'umi';
import { IHandlerOpts } from '../index';

const { createDebug, winPath } = utils;

const debug = createDebug('umiui:UmiUI:block:checkBindingInFile');

export default async ({ success, payload, api, failure }: IHandlerOpts) => {
  const { path: targetPath, name } = payload as {
    path: string;
    name: string;
  };
  const { paths } = api;
  debug('absPagesPath', paths.absPagesPath);
  debug('targetPath', targetPath);

  const absTargetPath = join(
    paths.absPagesPath,
    winPath(targetPath).replace(paths.absPagesPath, ''),
  );

  debug('absTargetPath', absTargetPath);

  if (!existsSync(absTargetPath) && !findJS({ base: absTargetPath, fileNameWithoutExt: '' })) {
    failure({
      message: ` ${absTargetPath} Directory does not exist!`,
      success: false,
    });
    return;
  }

  const entryPath =
    // Bar => Bar/index.(tsx|jsx|js|jsx)
    findJS({ base: absTargetPath, fileNameWithoutExt: 'index' }) ||
    // Bar => Bar.(tsx|jsx|js|jsx)
    findJS({ base: absTargetPath, fileNameWithoutExt: '' });

  debug('entryPath', entryPath);

  if (!entryPath) {
    failure({
      message: `No ${absTargetPath} found under the directory index.(ts|tsx|js|jsx) !`,
      success: false,
    });
    return;
  }
  const exists = await haveRootBinding(readFileSync(entryPath, 'utf-8'), name);

  success({
    exists,
    success: true,
  });
};
