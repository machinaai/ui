import ora from 'ora';
import { signale, rimraf, chalk } from '@umijs/utils';

import { makeSureMaterialsTempPathExist } from './download';

/**
 * Clean git cache directory
 * @param args
 * @param param1
 */
export function clearGitCache(args: { dryRun?: boolean }) {
  const spinner = ora();
  const blocksTempPath = makeSureMaterialsTempPathExist(args.dryRun);

  const info = `🗑  start clear: ${chalk.yellow(blocksTempPath)}`;
  spinner.start(info);

  try {
    rimraf.sync(blocksTempPath);
    spinner.succeed();
  } catch (error) {
    signale.error(error);
    spinner.stop();
  }

  return `🗑  start clear: ${blocksTempPath}`;
}
