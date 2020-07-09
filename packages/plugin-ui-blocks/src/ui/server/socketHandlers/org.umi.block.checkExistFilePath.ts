import { AddBlockParams } from '@machinaai/block-sdk/lib/data.d';
import { join } from 'path';
import { utils } from 'umi';
import { existsSync } from 'fs';
import { IHandlerOpts } from '../index';

const { winPath } = utils;

export default function({ success, payload, api }: IHandlerOpts) {
  const { path: blockPath } = payload as AddBlockParams;

  const absPath = winPath(join(api.paths.absPagesPath, blockPath));
  success({
    exists: existsSync(absPath),
    success: true,
  });
}
