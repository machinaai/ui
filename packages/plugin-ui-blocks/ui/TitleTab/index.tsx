import React, { useState, useContext, useEffect, useMemo, useLayoutEffect } from 'react';
import { Tabs } from 'antd';
import { stringify, parse } from 'qs';
import { Resource } from '@machinaai/block-sdk/lib/data.d';
import styles from './index.module.less';
import Container from '../Container';

const { TabPane } = Tabs;

export default function(props) {
  const { api, type, setType, setActiveResource } = Container.useContainer();
  const { useIntl } = api;
  const { formatMessage } = useIntl();

  const getQueryConfig = () => parse(window.location.search.substr(1));
  const updateUrlQuery = (params: { type: string; resource?: string }) => {
    const defaultParas = getQueryConfig();
    window.history.pushState(
      {},
      '',
      `?${stringify({
        ...defaultParas,
        ...params,
      })}`,
    );
  };

  return (
    <Tabs
      className={styles.tabs}
      size="large"
      activeKey={type}
      onChange={activeKey => {
        setType(activeKey as Resource['blockType']);
        setActiveResource(null);
        /**
         */
        updateUrlQuery({
          type: activeKey,
          resource: undefined,
        });
      }}
    >
      <TabPane tab={formatMessage({ id: 'org.umi.ui.blocks.tabs.blocks' })} key="block" />
      <TabPane tab={formatMessage({ id: 'org.umi.ui.blocks.tabs.templates' })} key="template" />
    </Tabs>
  );
}
