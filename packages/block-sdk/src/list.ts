import inquirer from 'inquirer';
import ora from 'ora';
import { got } from '@umijs/utils';

import { getBlockListFromGit, printBlocks, genBlockName } from './util';
import { addBlock } from './addBlock';

/**
 * Interactive block selection
 *-Choose block name
 *-Enter the path
 *-Choose whether to convert js
 * @param {[
 *  name:string;
 *  value:string;
 *  key:string;
 * ]} blockArray
 * @returns Promise<{args}>
 */
export async function selectInstallBlockArgs(blockArray) {
  return new Promise(async resolve => {
    let locale = false;
    const { block, path, js, uni18n } = await inquirer.prompt([
      {
        type: 'list',
        name: 'block',
        message: `⛰  Please select a block (a total of $ {blockArray.length} )`,
        choices: blockArray,
      },
      { type: 'input', name: 'path', message: '🏗 Please introduce the isntallation path of the block'},
      {
        type: 'confirm',
        name: 'js',
        message: '🤔 Convert Typescript blocks to js?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'uni18n',
        message: '🌎  Remove i18n code?',
        default: false,
      },
    ]);
    if (uni18n) {
      const { region } = await inquirer.prompt([
        {
          type: 'input',
          name: 'region',
          message: '🌎 Please enter your language of choice? ',
          default: 'es-ES',
        },
      ]);
      locale = region;
    }

    const blockPath = path || genBlockName(block);

    resolve({
      url: block,
      path: blockPath,
      js,
      uni18n: locale,
    });
  });
}

/**
 * Get the block list, which will be pulled from http://blocks.umijs.org/api/blocks by default
 * If defaultGitUrl is configured, it will be found from defaultGitUrl
 * @param {*} _
 * @param {*} blockConfig
 */
export async function getDefaultBlockList(_, blockConfig: any = {}, api) {
  const spinner = ora();
  let blockArray = [];
  const { defaultGitUrl } = blockConfig;

  spinner.start('🚣  fetch block list');

  // If there is a defaultGitUrl configuration, take the block list from the defaultGitUrl configuration
  if (defaultGitUrl) {
    // A github api can get the file tree
    const files = await getBlockListFromGit(defaultGitUrl);
    blockArray = printBlocks(files, 'link');
  } else {
    const { body } = await got(`http://blocks.umijs.org/api/blocks`);
    const { status, error, data } = JSON.parse(body);
    if (status === 'success') {
      blockArray = printBlocks(data);
    } else {
      throw new Error(error);
    }
  }

  spinner.succeed();

  if (blockArray.length > 0) {
    const args = await selectInstallBlockArgs(blockArray);
    return addBlock(args, {}, api);
  }
  return new Error('No block found');
}
