import * as IUi from '@machinaai/ui-types';

export enum DIR_ERROR_CODE {
  // https://nodejs.org/api/errors.html#errors_common_system_errors
  'EPERM' = 'EPERM',
}

export enum THEME {
  'dark' = 'dark',
  'light' = 'light',
}

export enum LOCALES {
  'es-ES' = 'Español',
  'en-US' = 'English',
}

export enum DINGTALK_MEMBERS {
  'Yun Qian' = 'dingtalk://dingtalkclient/action/sendmsg?dingtalk_id=mlc11tv',
  'Xiao Sheng' = 'dingtalk://dingtalkclient/action/sendmsg?dingtalk_id=ikobe621',
  'Yixin' = 'dingtalk://dingtalkclient/action/sendmsg?dingtalk_id=ycjcl868',
}

export type ILocale = keyof typeof LOCALES;

export enum LOCALES_ICON {
  'es-ES' = '🇲🇽',
  'en-US' = '🇺🇸',
}

export enum SPEEDUP_CLIENTS {
  'npm' = 'npm',
  'yarn' = 'yarn',
}

export enum PROJECT_STATUS {
  list = 'list',

  import = 'import',

  create = 'create',

  progress = 'progress',
}

export type IProjectStatus = keyof typeof PROJECT_STATUS;

export enum IDirectoryType {
  'directory' = 'directory',
  'file' = 'file',
}

export type APP_TYPE = 'ant-design-pro' | 'app';

export type APP_LANGUAGE = 'TypeScript' | 'JavaScript';

export enum REACT_FEATURES {
  antd = 'antd',
  dva = 'dva',
  'code splitting' = 'dynamicImport',
  dll = 'dll',
  internationalization = 'locale',
}

export enum REACT_FEATURES_TIP {
  antd = 'org.umi.ui.global.project.create.steps.info.reactFeatures.antd.tip',
  dva = 'org.umi.ui.global.project.create.steps.info.reactFeatures.dva.tip',
  'code splitting' = 'org.umi.ui.global.project.create.steps.info.reactFeatures.dynamicImport.tip',
  dll = 'org.umi.ui.global.project.create.steps.info.reactFeatures.dll.tip',
  internationalization = 'org.umi.ui.global.project.create.steps.info.reactFeatures.locale.tip',
}

export interface ICreateProgress {
  step: number;
  stepStatus: number;
  steps: { [key in ILocale]: string[] };
  success?: boolean;
  failure?: Error;
}

export interface IProjectItem extends IUi.ICurrentProject {
  creatingProgress?: {
    step: number;
    stepStatus: number;
    steps: string[];
    success?: boolean;
    failure?: Error;
  };
}

export interface IProjectList {
  currentProject: string;
  projectsByKey: {
    [key: string]: IProjectItem;
  };
}
