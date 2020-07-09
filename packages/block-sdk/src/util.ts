import chalk from 'chalk';
import { join } from 'path';
import { existsSync } from 'fs';
import { got, execa } from '@umijs/utils';
import ora from 'ora';

import GitUrlParse from 'git-url-parse';
import terminalLink from 'terminal-link';

import { BlockData } from './data.d';
import arrayToTree from './arrayToTree';

const JS_EXTNAMES = ['.js', '.jsx', '.ts', '.tsx'];
export interface IFindJSOpts {
  base: string;
  fileNameWithoutExt?: string;
}

export const findJS = (opts): string => {
  const { base, fileNameWithoutExt } = opts;
  let i = 0;
  while (i < JS_EXTNAMES.length) {
    const extname = JS_EXTNAMES[i];
    const absFilePath = fileNameWithoutExt
      ? join(base, `${fileNameWithoutExt}${extname}`)
      : `${base}${extname}`;
    if (existsSync(absFilePath)) {
      return absFilePath;
    }
    i += 1;
  }
  return null;
};

/**
 * Global use loading
 */
const spinner = ora();

/**
 * Determine if it is a gitmodules repository
 */
const isSubmodule = templateTmpDirPath => existsSync(join(templateTmpDirPath, '.gitmodules'));

/**
 * Get the fast registry Url(github.com or gitee.com)
 */
export const getFastGithub = async () => {
  const registryMap = {
    'github.com': 'https://github.com/ant-design/ant-design.git'
  };
  const promiseList = Object.keys(registryMap).map(async key =>
    got(registryMap[key])
      .catch(() => null)
      .then(() => Promise.resolve(key)),
  );
  try {
    const url = await Promise.race(promiseList);
    return url;
  } catch (e) {
    return 'github.com';
  }
};

/**
 * * For preview only *
 * Route mapped from file array to pro
 * @param {*} name
 */
export const genBlockName = name =>
  name
    .match(/[A-Z]?[a-z]+|[0-9]+/g)
    .map(p => p.toLowerCase())
    .join('/');

/**
 * Convert blocks to arrays usable by inquirer
 * @param {*} blocks
 * @returns {[
 *  name:string;
 *  value:string;
 *  key:string;
 * ]} blockArray
 */
export function printBlocks(blocks, hasLink?) {
  const blockArray = [];
  const loopBlocks = (blockItems, parentPath = '') => {
    blockItems.forEach(block => {
      if (block.type === 'block') {
        const blockName = join(parentPath, block.path);
        const { previewUrl } = block;
        let name = `📦  ${chalk.cyan(blockName)}  `;
        if (hasLink) {
          // Link to pro preview interface
          // AccountCenter -> account/center
          const link = terminalLink('Preview', `https://preview.pro.ant.design/${previewUrl}`);
          // Add a preview interface
          name += link;
        }
        blockArray.push({
          name,
          value: blockName,
          key: blockName,
        });
      }
      if (block.type === 'dir') {
        return loopBlocks(block.blocks, block.path);
      }
      return null;
    });
  };
  loopBlocks(blocks);
  return blockArray;
}

// https://gitee.com/ant-design/pro-blocks/raw/master/AccountCenter/snapshot.png
// https://raw.githubusercontent.com/ant-design/pro-blocks/master/AccountCenter/snapshot.png?raw=true
export const imgFilter = (list, { name, owner }, useGitee) => {
  if (!useGitee) {
    return list;
  }
  return list.map(item => ({
    ...item,
    img: item.img.replace(
      `https://raw.githubusercontent.com/${owner}/${name}/master/`,
    ),
  }));
};

export const getBlockListFromGit = async (gitUrl, useBuiltJSON?) => {
  const ignoreFile = ['_scripts', 'tests'];

  const { name, owner, resource } = GitUrlParse(gitUrl);

  if (spinner.isSpinning) {
    spinner.succeed();
  }

  if (useBuiltJSON) {
    const fastGithub = await getFastGithub();
    // use blockList.json in git repo
    const url =
      fastGithub === 'gitee.com'
        ? `https://gitee.com/${owner}/${name}/raw/master/umi-block.json`
        : `https://raw.githubusercontent.com/${owner}/${name}/master/umi-block.json`;

    spinner.start(`🔍  find block list form ${chalk.yellow(url)}`);
    try {
      const { body } = await got(url);
      spinner.succeed();
      // body = {blocks: [], templates: []}
      const data = JSON.parse(body);
      // TODO update format logic
      return imgFilter(
        data.list || data.blocks || data.template,
        {
          name,
          owner,
        },
        fastGithub === 'gitee.com',
      );
    } catch (error) {
      // if file 404
    }
    return [];
  }

  // If it is not github does not support this method, return an empty
  // Can make some appointments, next time
  if (resource !== 'github.com') {
    return [];
  }

  // A github api can get the file tree
  const url = `https://api.github.com/repos/${owner}/${name}/git/trees/master`;
  spinner.start(`🔍  find block list form ${chalk.yellow(url)}`);
  const { body } = await got(url);
  const filesTree = JSON.parse(body)
    .tree.filter(
      file =>
        file.type === 'tree' && !ignoreFile.includes(file.path) && file.path.indexOf('.') !== 0,
    )
    .map(({ path }) => ({
      url: `${gitUrl}/tree/master/${path}`,
      type: 'block',
      path,
      isPage: true,
      defaultPath: `/${path}`,
      img: `https://github.com/ant-design/pro-blocks/raw/master/${path}/snapshot.png`,
      tags: ['Ant Design Pro'],
      name: path,
      previewUrl: `https://preview.pro.ant.design/${genBlockName(path)}`,
    }));
  spinner.succeed();
  return filesTree;
};

/**
 * The cloned git will be cached. This method can update the cache
 * @param {*} ctx
 * @param {*} mySpinner
 */
export async function gitUpdate(ctx, mySpinner) {
  mySpinner.start(`🚛  sync file for git repo --branch ${ctx.branch}`);

  try {
    await execa('git', ['checkout', ctx.branch], {
      cwd: ctx.templateTmpDirPath,
      stdio: 'inherit',
    });
  } catch (e) {
    mySpinner.fail();
    throw new Error(e);
  }

  try {
    await execa('git', ['fetch'], {
      cwd: ctx.templateTmpDirPath,
      stdio: 'inherit',
    });
  } catch (e) {
    mySpinner.fail();
    throw new Error(e);
  }

  try {
    await execa('git', ['pull'], {
      cwd: ctx.templateTmpDirPath,
      stdio: 'inherit',
    });
    // If it is after git pull
    // git module can only be initialized by this method
    if (isSubmodule(ctx.templateTmpDirPath)) {
      // If the branch is switched, it may not be initialized, initialize it
      await execa('git', ['submodule', 'init'], {
        cwd: ctx.templateTmpDirPath,
        env: process.env,
        stdio: 'inherit',
      });

      await execa('git', ['submodule', 'update', '--recursive'], {
        cwd: ctx.templateTmpDirPath,
        stdio: 'inherit',
      });
    }
  } catch (e) {
    mySpinner.fail();
    throw new Error(e);
  }
  mySpinner.succeed();
}

/**
 * tie children
 * {
 *    path:"/user",
 *    children:[{ path: "/user/list" }]
 *  }
 *  --->
 *  /user /user/list
 * @param treeData
 */
export const reduceData = treeData =>
  treeData.reduce((pre, current) => {
    const router = pre[current.key];
    let childrenKeys = {};
    if (current && current.children) {
      childrenKeys = reduceData(current.children);
    }

    if (!router) {
      pre[current.key] = { ...current, children: undefined };
      delete pre[current.key].children;
    }
    return {
      ...pre,
      ...childrenKeys,
    };
  }, {});

/**
 * Cloned block address
 * @param {*} ctx
 * @param {*} mySpinner
 */
export async function gitClone(ctx, mySpinner) {
  mySpinner.start(`🔍  clone git repo from ${ctx.repo}`);
  try {
    await execa('git', ['clone', ctx.repo, ctx.id, '--recurse-submodules'], {
      cwd: ctx.blocksTempPath,
      env: process.env,
      stdio: 'inherit',
    });
  } catch (e) {
    mySpinner.fail();
    throw new Error(e);
  }
  mySpinner.succeed();
}

/**
 * Remove duplicate underscores or something
 * @param path
 */
export const removePrefix = path => path.replace(/\//g, '/').replace(/\/\//g, '/');
/**
 * Add routing prefix
 * data -> /data
 * @param path
 * @param parentPath
 */
export const addRoutePrefix = (path = '/', parentPath = '/') => {
  if (path.indexOf('/') !== 0) {
    return removePrefix(`${parentPath}/${path}`);
  }
  return path;
};

export const genRouterToTreeData = (routes, path = '/') =>
  routes
    .map(item => {
      const prefixPath = addRoutePrefix(item.path, path);
      if (item.path || item.routes) {
        return {
          title: removePrefix(prefixPath.replace(path, '')) || '/',
          value: prefixPath,
          key: prefixPath,
          children: genRouterToTreeData(item.routes || [], prefixPath),
        };
      }
      return undefined;
    })
    .filter(item => item);

/**
 * According to router to get component
 * Used for block insertion
 * @param {*} routes
 */
export const genComponentToTreeData = (routes, path = '/') =>
  routes
    .map(item => {
      const prefixPath = addRoutePrefix(item.path, path);
      return item.path || item.routes || item.component
        ? {
            title: removePrefix(prefixPath.replace(path, '/')) || '/',
            value: item.component
              ? item.component.replace(/(index)?((\.js?)|(\.tsx?)|(\.jsx?))$/, '')
              : '',
            key: prefixPath,
            children: genComponentToTreeData(item.routes || [], prefixPath),
          }
        : undefined;
    })
    .filter(item => item);

/**
 * Determine if the route exists
 * @param {*} path string
 * @param {*} routes
 */
export function routeExists(path, routes = []) {
  const routerConfig = reduceData(genRouterToTreeData(routes));
  if (routerConfig[path]) {
    return true;
  }
  return false;
}

/**
 * Get routing data
 * @param {*} routes
 */
export const depthRouterConfig = routerConfig => {
  const getParentKey = (key = '') => {
    const routerKeyArray = key.split('/').filter(routerKey => routerKey);
    routerKeyArray.pop();
    return `/${routerKeyArray.join('/')}`;
  };

  return arrayToTree(
    Object.keys(routerConfig)
      .sort((a, b) => a.split('/').length - b.split('/').length + a.length - b.length)
      .map(key => {
        const parentKey = getParentKey(key);
        return {
          ...routerConfig[key],
          parentKey: parentKey === '/' ? null : parentKey,
        };
      }),
    {
      id: 'key',
      parentId: 'parentKey',
      dataField: null,
    },
  );
};

export interface TreeData {
  title: string;
  value: string;
  key: string;
  children?: TreeData[];
}

/**
 * get BlockList from blockList.json in github repo
 */
export const fetchBlockList = async (repo: string): Promise<BlockData> => {
  try {
    const blocks = await getBlockListFromGit(`https://github.com/${repo}`, true);
    return {
      data: blocks,
      success: true,
    };
  } catch (error) {
    return {
      message: error.message,
      data: undefined,
      success: false,
    };
  }
};

export async function fetchUmiBlock(url) {
  try {
    const { body } = await got(url);
    return {
      data: JSON.parse(body).list,
      success: true,
    };
  } catch (error) {
    return {
      message: error.message,
      data: undefined,
      success: false,
    };
  }
}

/**
 * Get block data through npm CDN url
 * @param pkg Package names
 */
export async function fetchCDNBlocks({
  pkg,
  summary = 'umi-block.json',
  version = 'latest',
  factor,
}) {
  const prefixCDN = `https://cdn.jsdelivr.net/npm/${pkg}@${version}`;
  try {
    const { body } = await got(`${prefixCDN}/${summary}`);
    const data = JSON.parse(body);
    const list = (data.list || data.blocks || data.template).map(factor || (item => item));
    return {
      data: list,
      success: true,
    };
  } catch (error) {
    return {
      message: error.message,
      data: undefined,
      success: false,
    };
  }
}
