import assert from 'assert';
import { utils } from 'umi';
import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';
import getNpmRegistry from 'getnpmregistry';

import { IFlowContext, IAddFilesBlockOption, ICtxFilesTypes } from '../../types';
import { addPrefix } from '../helper';

const { createDebug, winPath } = utils;

const debug = createDebug('umi:umiui:UmiUI:block:filetasks');

/**
 * Parsing url，
 * @param ctx
 * @param args
 */
export default async (ctx: IFlowContext, args: IAddFilesBlockOption) => {
  const { files } = args;
  debug('files parse args', args);
  // ctx.logger.setId(url);
  ctx.result.files = files;

  assert(files, `run ${chalk.cyan.underline('umi help block')} to checkout the usage`);
  const { config, cwd } = ctx.api;
  const blockConfig: {
    npmClient?: string;
  } = config.block || {};

  const useYarn = existsSync(join(cwd, 'yarn.lock'));
  const defaultNpmClient = blockConfig.npmClient || (useYarn ? 'yarn' : 'npm');
  const registryUrl = await getNpmRegistry();
  // setup route path
  const { path } = args;

  const filePath = winPath(path);
  const blockCtx: ICtxFilesTypes = {
    ...args,
    npmClient: args.npmClient || defaultNpmClient,
    routePath: addPrefix(args.routePath || filePath),
    filePath,
    pkg: {
      dependencies: args.dependencies || {},
      peerDependencies: args.peerDependencies || {},
      devDependencies: args.devDependencies || {},
    },
  };

  ctx.stages.blockCtx = blockCtx;
  ctx.stages.registry = args.registry || registryUrl;
};
