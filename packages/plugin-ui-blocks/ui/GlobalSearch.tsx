import React from 'react';
import { Input } from 'antd';
import { IUiApi } from '@machinaai/ui-types';

import { SearchOutlined } from '@ant-design/icons';
import styles from './GlobalSearch.module.less';

interface IGlobalSearch {
  onChange: (v: string) => void;
  api: IUiApi;
}

const GlobalSearch: React.SFC<IGlobalSearch> = props => {
  const { onChange, api } = props;
  const { useIntl, hooks, _ } = api;
  const { formatMessage } = useIntl();
  let debounceFn = _.debounce;
  // compatible with prev version umi ui
  if (hooks?.useDebounceFn) {
    debounceFn = hooks.useDebounceFn;
  }

  const handleChange = debounceFn((value: string) => {
    onChange(value);
  }, 300);
  const handleChangeDebounce = handleChange?.run || handleChange;

  return (
    <Input
      prefix={<SearchOutlined />}
      className={styles.search}
      allowClear
      size={api.mini ? 'small' : 'middle'}
      onChange={e => handleChangeDebounce(e.target.value)}
      placeholder={formatMessage({ id: 'org.umi.ui.blocks.content.search_block' })}
    />
  );
};

export default GlobalSearch;
