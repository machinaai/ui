import { createContext, Context } from 'react';
import * as IUi from '@machinaai/ui-types';

const UIContext = createContext({} as IUi.IContext);

export default UIContext;
