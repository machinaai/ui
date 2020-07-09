import React from 'react';
import { IUiApi } from '@machinaai/ui-types';
import { DashboardFilled } from '@ant-design/icons';
import Dashboard from './ui/index';
import ConfigAction from './ui/action';
import Layout from './ui/layout';
import DailyReportTitle from './ui/plugins/dailyReportTitle';
import DailyReport from './ui/plugins/dailyReport';
import DailyReportHeader from './ui/plugins/dailyReportHeader';
import esES from './locales/es-ES';
import enUS from './locales/en-US';
import styles from './ui/index.module.less';

export default (api: IUiApi) => {
  api.addLocales({
    'es-ES': esES,
    'en-US': enUS,
  });

  const { FormattedMessage } = api.intl;

  api.addDashboard({
    key: 'org.umi.dashboard.card.zaobao',
    title: <DailyReportTitle />,
    description: <FormattedMessage id="org.umi.ui.dashboard.card.zaobao.description" />,
    icon: 'https://img.alicdn.com/tfs/TB1JJ12nbr1gK0jSZFDXXb9yVXa-225-225.png',
    right: <DailyReportHeader />,
    colClassName: styles['zaobao-col'],
    content: <DailyReport />,
  });

  api.addPanel({
    title: 'org.umi.ui.dashboard.panel',
    path: '/dashboard',
    actions: [
      <Layout api={api}>
        <ConfigAction />
      </Layout>,
    ],
    icon: <DashboardFilled />,
    component: () => (
      <Layout api={api}>
        <Dashboard />
      </Layout>
    ),
  });
};
