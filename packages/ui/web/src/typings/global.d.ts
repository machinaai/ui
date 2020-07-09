import EventEmitter from 'events';
import { Context } from 'react';

import * as IUi from '@machinaai/ui-types';
import { Terminal } from 'xterm';
import esES from '../locales/es-ES';

declare global {
  interface Window {
    xterm: any;
    gtag?: any;
    Tracert?: any;
    g_app?: any;
    Terminal: typeof Terminal;
    g_lang: IUi.ILang;
    g_uiCurrentProject: IUi.ICurrentProject;
    g_uiProjects?: { [key: string]: IUi.ICurrentProject };
    g_uiPlugins?: any[];
    g_bigfish?: boolean;
    g_uiContext: Context<IUi.IContext>;
    g_service: IUi.IService;
    g_uiBasicUI: Function[];
  }
}

type lang = keyof typeof esES;

declare module 'umi' {
  export default interface MessageDescriptor {
    id: lang extends string ? lang : string;
  }
}
