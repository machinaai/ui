import { createContext } from 'react';
import { IUiApi } from '@machinaai/ui-types';

const UIApiContext = createContext({} as { api: IUiApi });

export default UIApiContext;
