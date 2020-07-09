import { IApi } from 'umi';
import Logger from '../Logger';

interface IPkg {
  devDependencies?: object;
  peerDependencies?: object;
  dependencies?: object;
}

export interface IFlowContext {
  logger: Logger;
  api: IApi;
  execa: any;
  stages: any;
  result: any;
  pkg?: IPkg;
}

export interface IBlockCommon {
  _?: string[];
  blockType?: 'block' | 'template';

  path?: string;

  routePath?: string;

  npmClient?: string;

  dryRun?: boolean;

  skipDependencies?: boolean;

  skipModifyRoutes?: boolean;

  page?: boolean;

  layout?: boolean;

  registry?: string;

  js?: boolean;

  uni18n?: boolean;

  execution?: 'shell' | 'auto';

  index?: number;

  remoteLog?: (log: string) => void;

  name: string;
}

export interface IAddBlockOption extends IBlockCommon {
  url?: string;

  branch?: string;
}

export interface IAddFilesBlockOption extends IBlockCommon {
  files?: {
    [key: string]: string;
  };
  devDependencies?: object;
  peerDependencies?: object;
  dependencies?: object;
}

export interface ICtxTypes {
  repo?: any;
  branch?: any;
  path?: string;
  id?: string;
  routePath?: string;
  isLocal?: boolean;
  sourcePath?: string;
  repoExists?: boolean;
  filePath?: string;
  templateTmpDirPath?: string;
  pkg?: { blockConfig: { [key: string]: any } };

  blocksTempPath?: string;
}

export interface ICtxFilesTypes {
  routePath?: string;
  isLocal?: boolean;
  filePath?: string;
  npmClient?: string;
  pkg?: any;
}
