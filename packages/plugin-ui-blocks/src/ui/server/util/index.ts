import fs from 'fs';
import chalk from 'chalk';
import { join } from 'path';
import { utils } from 'umi';
import { fetchCDNBlocks } from '@machinaai/block-sdk';
import { fetchBlockList } from '@machinaai/block-sdk';
import { Resource } from '@machinaai/block-sdk/lib/data.d';

const { winPath } = utils;

export interface TreeData {
  title: string;
  value: string;
  key: string;
  children?: TreeData[];
}

/**

 * @param path
 */
export const getFolderTreeData = (
  path: string,
  parentPath: string = '/',
  depth: number = 0,
): TreeData[] => {
  const files = fs.readdirSync(winPath(path));
  return files
    .map((fileName: string) => {
      const status = fs.statSync(join(path, fileName));

      if (status.isDirectory() && fileName.indexOf('.') !== 0 && depth < 3) {
        const absPath = winPath(join(path, fileName));
        const absPagePath = winPath(join(parentPath, fileName));
        const children = getFolderTreeData(absPath, absPagePath, depth + 1);
        if (children && children.length > 0) {
          return {
            key: absPagePath,
            title: fileName,
            value: absPagePath,
            children,
          };
        }
        return { title: fileName, value: absPagePath, key: absPagePath };
      }
      return undefined;
    })
    .filter(obj => obj);
};

/**

 * @param path
 */
export const getFilesTreeData = (
  path: string,
  parentPath: string = '/',
  depth: number = 0,
): TreeData[] => {
  const files = fs.readdirSync(winPath(path));
  return files
    .map((fileName: string) => {
      const status = fs.statSync(join(path, fileName));
      const isDirectory = status.isDirectory();

      if (fileName.indexOf('.') !== 0 && depth < 5) {
        if (
          !isDirectory &&
          !fileName.includes('.tsx') &&
          !fileName.includes('.jsx') &&
          !fileName.includes('.js') &&
          !fileName.includes('.ts')
        ) {
          return undefined;
        }
        const absPath = winPath(join(path, fileName));
        const absPagePath = winPath(join(parentPath, fileName));
        const children = isDirectory ? getFilesTreeData(absPath, absPagePath, depth + 1) : [];
        return {
          selectable: !isDirectory,
          key: absPagePath,
          title: fileName,
          value: absPagePath,
          children,
        };
      }
      return undefined;
    })
    .filter(obj => obj);
};

export const DEFAULT_RESOURCES: Resource[] = [
  /*{
    id: 'ant-design-pro',
    name: 'Ant Design Pro',
    resourceType: 'custom',
    description: 'Plantilla de etapa intermedia basada en Antd.',
    blockType: 'template',
    icon: 'https://img.alicdn.com/tfs/TB1e8gomAL0gK0jSZFAXXcA9pXa-64-64.png',
    getData: () =>
      fetchCDNBlocks({
        pkg: 'pro-blocks',
        summary: 'umi-block.json',
        version: '^1.0.0',
      }),
  },
  {
    id: 'ant-design-blocks',
    name: 'Ant Design',
    resourceType: 'custom',
    description: 'Bloque de demostración de antd',
    blockType: 'block',
    icon: 'https://img.alicdn.com/tfs/TB1e8gomAL0gK0jSZFAXXcA9pXa-64-64.png',
    getData: () =>
      fetchCDNBlocks({
        pkg: 'ant-design-blocks',
        summary: 'umi-block.json',
        version: '^1.0.0',
      }),
  },
  {
    id: 'umi-blocks',
    name: 'Umi Community',
    resourceType: 'custom',
    description: 'Bloques de la comunidad',
    blockType: 'block',
    icon: 'https://img.alicdn.com/tfs/TB1HMEpmuH2gK0jSZFEXXcqMpXa-64-64.png',
    getData: () =>
      fetchCDNBlocks({
        pkg: '@umijs/assets-umi',
        summary: 'blocks.json',
        version: '~1.0.0',
      }),
  },
  {
    id: 'umi-blocks-template',
    name: 'Umi Community',
    resourceType: 'custom',
    description: 'Plantilla de la comunidad Umi',
    blockType: 'template',
    icon: 'https://img.alicdn.com/tfs/TB1HMEpmuH2gK0jSZFEXXcqMpXa-64-64.png',
    getData: () =>
      fetchCDNBlocks({
        pkg: '@umijs/assets-umi',
        summary: 'templates.json',
        version: '~1.0.0',
      }),
  },*/
  {
    id: 'ant-design-pro',
    name: 'React Design',
    resourceType: 'custom',
    description: 'Plantilla de referencia',
    blockType: 'template',
    icon: 'https://raw.githubusercontent.com/machinaai/logos/master/logo1.png',
    getData: () =>
      fetchBlockList('machinaai/pro-blocks'),
  },
  {
    id: 'ant-design-blocks',
    name: 'React Design',
    resourceType: 'custom',
    description: 'Bloque de demostración',
    blockType: 'block',
    icon: 'https://raw.githubusercontent.com/machinaai/logos/master/logo1.png',
    getData: () =>
      fetchBlockList('machinaai/blocks'),
  },
  {
    id: 'nova-pro-blocks',
    name: 'Nova Templates',
    resourceType: 'custom',
    description: 'Plantillas de nova',
    blockType: 'template',
    icon: 'https://raw.githubusercontent.com/machinaai/logos/master/nova.png',
    getData: () =>
      fetchBlockList('machinaai/nova-pro-blocks'),
  },
  {
    id: 'nova-blocks',
    name: 'Nova Blocks',
    resourceType: 'custom',
    description: 'Bloques de nova',
    blockType: 'block',
    icon: 'https://raw.githubusercontent.com/machinaai/logos/master/nova.png',
    getData: () =>
      fetchBlockList('machinaai/nova-blocks'),
  }
];

export const createBlockLog = log => (logType: 'error' | 'info', info: string) =>
  log(logType, `${chalk.hex('#40a9ff')('block:')} ${info}`);

export const getBlockList = async (resourceId: string, list: Resource[]) => {
  const resource = list.find(item => item.id === resourceId);
  if (resource) {
    if (resource.resourceType === 'custom') {
      const { data } = await resource.getData();
      return data;
    }
    return [];
  }
  throw new Error(`not find resource ${resourceId}`);
};
