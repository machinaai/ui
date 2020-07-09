import { createContext } from 'react';
import { IUiApi } from '@machinaai/ui-types';

const UIContext = createContext({} as { api: IUiApi });

export default UIContext;
