import { utils } from 'umi';
import { appendBlockToContainer, writeNewRoute } from '@machinaai/block-sdk';
import { IFlowContext, IAddBlockOption } from '../../types';

const { chalk, createDebug } = utils;

const debug = createDebug('umiui:UmiUI:block');

const writeRoutes = async (ctx: IFlowContext, args: IAddBlockOption) => {
  const { generator } = ctx.stages;
  const { api, logger } = ctx;
  const { skipModifyRoutes, layout: isLayout, dryRun, index } = args;

  if (generator.needCreateNewRoute && api.userConfig.routes && !skipModifyRoutes) {
    logger.appendLog(
      `🛠 Start write route from ${generator.routePath} to ${api.service.configInstance.configFile}`,
    );
    debug('api.service.configInstance.configFile', api.service.configInstance.configFile);

    const newRouteConfig = await api.applyPlugins({
      key: '_modifyBlockNewRouteConfig',
      type: api.ApplyPluginsType.modify,
      initialValue: {
        name: args.name,
        path: generator.routePath.toLowerCase(),
        component: `.${generator.path}`,
        ...(isLayout ? { routes: [] } : {}),
      },
    });
    try {
      if (!dryRun) {
        writeNewRoute(newRouteConfig, api.service.configInstance.configFile, api.paths.absSrcPath);
      }
    } catch (e) {
      logger.appendLog(`Failed to write route: ${e.message}\n`);
      throw new Error(e);
    }
    logger.appendLog('🎉  Success write route\n');
  }

  if (!generator.isPageBlock) {
    logger.appendLog(
      `🍽  Start write block component ${generator.blockFolderName} import to ${generator.entryPath}`,
    );
    debug('writeRoutes appendBlockToContainer');
    appendBlockToContainer({
      entryPath: generator.entryPath,
      blockFolderName: generator.blockFolderName,
      dryRun,
      index,
      logger,
    });
    logger.appendLog('🎉  Success write block component \n');
  }
  const { PORT, BASE_PORT } = process.env;
  // Final: show success message
  const viewUrl = `http://localhost:${BASE_PORT || PORT || '8000'}${generator.path.toLowerCase()}`;
  logger.appendLog(`✨  Probable url ${chalk.cyan(viewUrl)} for view the block.`);
};

export default writeRoutes;
