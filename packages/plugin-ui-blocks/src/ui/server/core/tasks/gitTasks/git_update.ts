import assert from 'assert';
import { utils } from 'umi';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { getNameFromPkg } from '@machinaai/block-sdk';
import { IFlowContext, ICtxTypes, IAddBlockOption } from '../../types';
import { isSubmodule, addPrefix } from '../helper';

const { winPath } = utils;

const clone = async (ctx: IFlowContext, args: IAddBlockOption) => {
  const { logger, execa } = ctx;
  const { branch, templateTmpDirPath, sourcePath, routePath } = ctx.stages.blockCtx as ICtxTypes;

  logger.appendLog('⚓  Start git fetch');
  try {
    await execa('git', ['fetch'], {
      cwd: templateTmpDirPath,
    });
  } catch (e) {
    logger.appendLog(`Faild git fetch: ${e.message}`);
    throw new Error(e);
  }
  logger.appendLog('🎉  Success git fetch\n');

  logger.appendLog(`⚓  Start git checkout ${branch}`);
  try {
    await execa('git', ['checkout', branch], {
      cwd: templateTmpDirPath,
    });
  } catch (e) {
    logger.appendLog(`Faild git checkout: ${e.message}\n`);
  }

  logger.appendLog(`🎉  Success git checkout ${branch}\n`);

  logger.appendLog('⚓  Start git pull');

  try {
    await execa('git', ['pull'], {
      cwd: templateTmpDirPath,
    });

    if (isSubmodule(templateTmpDirPath)) {
      await execa('git', ['submodule', 'init'], {
        cwd: templateTmpDirPath,
        env: process.env,
      });

      await execa('git', ['submodule', 'update', '--recursive'], {
        cwd: templateTmpDirPath,
      });
    }
  } catch (e) {
    if (e.killed) {
      const err = new Error('Cancel git pull');
      err.name = 'GitUpdateError';
      logger.appendLog('Cancel git pull\n');
      throw err;
    }
    logger.appendLog(`Faild git pull: ${e.message || ''}\n`);
    throw e;
  }

  logger.appendLog('🎉  Success git pull\n');

  assert(existsSync(sourcePath), `${sourcePath} don't exists`);
  let pkg;
  // get block's package.json
  const pkgPath = join(sourcePath, 'package.json');
  if (!existsSync(pkgPath)) {
    throw new Error(`not find package.json in ${this.sourcePath}`);
  } else {
    // eslint-disable-next-line
    pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    ctx.stages.blockCtx.pkg = pkg;
  }

  // setup route path
  const { path } = args;
  let filePath = '';
  if (!path) {
    const blockName = getNameFromPkg(pkg);
    if (!blockName) {
      const errMsg = "Can not find name in block's package.json";
      logger.appendLog(errMsg);
      const err = new Error(errMsg);
      throw err;
    }

    filePath = `/${blockName}`;
  } else {
    filePath = winPath(path);
  }

  ctx.stages.blockCtx.filePath = addPrefix(filePath);

  if (!routePath) {
    ctx.stages.blockCtx.routePath = filePath;
  }

  ctx.stages.blockCtx.routePath = addPrefix(ctx.stages.blockCtx.routePath);
};

export default clone;
