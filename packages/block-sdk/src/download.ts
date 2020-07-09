import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { spawn, mkdirp, createDebug } from '@umijs/utils';
import { homedir } from 'os';
import GitUrlParse from 'git-url-parse';
import { getFastGithub } from './util';

const debug = createDebug('umi:umiui:MaterialDownload');
const spawnSync = spawn.sync;

/**
 * Make sure the temporary path of the asset exists
 * @param dryRun Confirm existence
 */
export function makeSureMaterialsTempPathExist(dryRun) {
  const userHome = process.env.NODE_ENV === 'test' ? '/Users/test' : homedir();
  const blocksTempPath = join(userHome, '.umi3/blocks');
  if (dryRun) {
    return blocksTempPath;
  }
  if (!existsSync(blocksTempPath)) {
    debug(`mkdir blocksTempPath ${blocksTempPath}`);
    mkdirp.sync(blocksTempPath);
  }
  return blocksTempPath;
}

/**
 * Download from url git to local temporary directory
 * @param url
 * @param id
 * @param branch
 * @param log
 * @param args
 */
export function downloadFromGit(url, id, branch = 'master', log, args: any = {}) {
  const { dryRun } = args;
  const blocksTempPath = makeSureMaterialsTempPathExist(dryRun);
  const templateTmpDirPath = join(blocksTempPath, id);

  if (existsSync(templateTmpDirPath)) {
    // git repo already exist, pull it
    // cd id && git pull
    log.info(`${url} exist in cache, start pull from git to update...`);
    if (dryRun) {
      log.log(`dryRun is true, skip git pull`);
    } else {
      spawnSync('git', ['fetch'], {
        cwd: templateTmpDirPath,
      });
      spawnSync('git', ['checkout', branch], {
        cwd: templateTmpDirPath,
      });
      spawnSync('git', ['pull'], {
        cwd: templateTmpDirPath,
      });
    }
  } else {
    // new git repo, clone
    // git clone url id
    log.info(`start clone code from ${url}...`);
    if (dryRun) {
      log.log(`dryRun is true, skip git clone`);
    } else {
      spawnSync('git', ['clone', url, id, '--single-branch', '-b', branch], {
        cwd: blocksTempPath,
      });
    }
  }
  log.info(`code download to ${templateTmpDirPath}`);
  return templateTmpDirPath;
}

// git site url maybe like: http://gitlab.alitest-inc.com/bigfish/bigfish-blocks/tree/master/demo
// or http://gitlab.alitest-inc.com/bigfish/testblocks/tree/master
// or http://gitlab.alitest-inc.com/bigfish/testblocks
// or https://github.com/machinaai/umi-blocks/tree/master/demo
// or https://github.com/alibaba/ice/tree/master/react-blocks/blocks/AbilityIntroduction
// eslint-disable-next-line no-useless-escape
const gitSiteParser = /^(https\:\/\/|http\:\/\/|git\@)((github|gitlab)[\.\w\-]+|(?:(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}(?:[0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))(\/|\:)([\w\-]+)\/([\w\-]+)(\/tree\/([\w\.\-]+)([\w\-\/]+))?(.git)?$/;
export function isGitUrl(url) {
  return gitSiteParser.test(url);
}

/**
 * gitlab without .git will redirect the user to login
 * @param {*} url
 */
export const urlAddGit = url => {
  if (/\.git$/.test(url)) {
    return url;
  }
  return `${url}.git`;
};

/**
 * Return to master by default
 * master is umi @ 2 and antd @ 4
 * umi @ 3 & antd @ 3 and antd @ 3 and umi @ 3
 * umi @ 3 is umi @ 3 and antd @ 4
 * @param ref
 */
const getAntdVersion = (ref: string) => {
  try {
    const { version } = require('antd');
    // antd @ 3 and the branch of umi @ 2
    if (version.startsWith(3) && ref === 'master') {
      return 'antd@3';
    }
  } catch (error) {
    // console.log(error)
  }

  if (process.env.BLOCK_REPO_BRANCH) {
    return process.env.BLOCK_REPO_BRANCH;
  }

  return ref;
};

export async function parseGitUrl(url, closeFastGithub) {
  const args = GitUrlParse(url);
  const { ref, filepath, resource, full_name: fullName } = args;
  const fastGithub = await getFastGithub();

  // If it is github and autoFastGithub = true use
  // Because automatic conversion only supports github, you can also turn it off
  const repo =
    resource === 'github.com' && !closeFastGithub
      ? args.toString().replace(`${resource}`, fastGithub)
      : args.toString();

  return {
    repo: urlAddGit(repo),
    // When name = ant-design / pro-blocks, the block branched by umi @ 3 should be used
    branch: getAntdVersion(ref) || 'master',
    path: `/${filepath}`,
    id: `${resource}/${fullName}`, // Uniquely identify a git repository
  };
}

/**
 * Parse url => branch, repo
 * @param url
 * @param blockConfig
 */
export async function getParsedData(url, blockConfig) {
  debug(`url: ${url}`);
  let realUrl;
  const defaultGitUrl = blockConfig.defaultGitUrl || 'https://github.com/machinaai/umi-blocks';
  if (isGitUrl(url)) {
    realUrl = url;
    debug('is git url');
    // eslint-disable-next-line no-useless-escape
  } else if (/^[\w]+[\w\-\/]*$/.test(url)) {
    realUrl = `${defaultGitUrl}/tree/master/${url}`;
    debug(`will use ${realUrl} as the block url`);
    // eslint-disable-next-line no-useless-escape
  } else if (/^[\.\/]|^[c-zC-Z]:/.test(url)) {
    // The purpose is to support the absolute path under the window, such as `C:\\Project\\umi`
    // locale path for test
    const sourcePath = resolve(process.cwd(), url);
    debug(`will use ${sourcePath} as the block url`);
    return {
      isLocal: true,
      sourcePath,
    };
  } else {
    throw new Error(`${url} can't match any pattern`);
  }
  const args = await parseGitUrl(realUrl, blockConfig.closeFastGithub);
  debug('getParsedData args', args);
  return args;
}
