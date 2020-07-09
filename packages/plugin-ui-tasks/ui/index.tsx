import React, { useEffect } from 'react';
import { IUiApi } from '@machinaai/ui-types';
import { SettingOutlined, ProjectFilled } from '@ant-design/icons';
import Dev from './components/Dev';
import Build from './components/Build';
import Lint from './components/Lint';
import Test from './components/Test';
import Install from './components/Install';
import { initApiToGloal } from './util';
import { TaskType } from '../src/server/core/enums';
import styles from './ui.module.less';
import enUS from './locales/en-US';
import esES from './locales/es-ES';
import model from './model';

export default (api: IUiApi) => {
  initApiToGloal(api);

  const { TwoColumnPanel } = api;
  const imgProperty = {
    width: api.mini ? '24' : '32',
    height: api.mini ? '24' : '32',
  };

  const SCRIPTS = {
    [TaskType.DEV]: {
      key: 'dev',
      title: 'org.umi.ui.tasks.dev',
      icon: (
        <img
          {...imgProperty}
          src="https://gw.alipayobjects.com/zos/basement_prod/6000d285-334d-4513-a405-2d9f890f56e9.svg"
        />
      ),
      description: 'org.umi.ui.tasks.dev.desc',
      Component: Dev,
    },
    [TaskType.BUILD]: {
      key: 'build',
      title: 'org.umi.ui.tasks.build',
      icon: (
        <img
          {...imgProperty}
          src="https://gw.alipayobjects.com/zos/basement_prod/6000d285-334d-4513-a405-2d9f890f56e9.svg"
        />
      ),
      description: 'org.umi.ui.tasks.build.desc',
      Component: Build,
    },
    [TaskType.LINT]: {
      key: 'lint',
      title: 'org.umi.ui.tasks.lint',
      icon: (
        <img
          {...imgProperty}
          src="https://gw.alipayobjects.com/zos/basement_prod/fb3b6fab-253e-41fc-981a-8bfc5dc4fede.svg"
        />
      ),
      description: 'org.umi.ui.tasks.lint.desc',
      Component: Lint,
    },
    [TaskType.TEST]: {
      key: 'test',
      title: 'org.umi.ui.tasks.test',
      icon: (
        <img
          {...imgProperty}
          src="https://gw.alipayobjects.com/zos/basement_prod/f0d64a31-1767-4ab7-a7f9-eea044d92ce3.svg"
        />
      ),
      description: 'org.umi.ui.tasks.test.desc',
      Component: Test,
    },
    [TaskType.INSTALL]: {
      key: 'install',
      title: 'org.umi.ui.tasks.install',
      icon: (
        <img
          {...imgProperty}
          src="https://gw.alipayobjects.com/zos/basement_prod/d9fbc2fa-5bb6-46f4-bd15-385a94bc6d1c.svg"
        />
      ),
      description: 'org.umi.ui.tasks.install.desc',
      Component: Install,
    },
  };

  const { Terminal: ApiTerminal } = api;

  const Terminal = props => (
    <ApiTerminal
      config={{
        allowTransparency: true,
        fontFamily: `operator mono,SFMono-Regular,Consolas,Liberation Mono,Menlo,monospace`,
        cursorBlink: false,
        cursorStyle: 'underline',
        disableStdin: true,
        ...(api.isMini() ? { fontSize: 12 } : {}),
      }}
      {...props}
    />
  );

  const TasksView = ({ taskManager, dispatch }) => {
    useEffect(() => {
      dispatch({
        type: `${model.namespace}/init`,
        payload: {
          currentProject: api.currentProject,
          getSharedDataDir: api.getSharedDataDir,
        },
      });
    }, []);
    const sections = Object.keys(SCRIPTS).filter(item => {
      if (api.mini && item === TaskType.DEV) {
        return false;
      }
      return true;
    });

    const { iife: searchIIFE } = api.getSearchParams();
    const iife = searchIIFE === 'true';

    return (
      <TwoColumnPanel
        sections={sections.map((taskType: string) => {
          const { key, title, icon, description, Component } = SCRIPTS[taskType];
          const currentProjectKey = api.currentProject.path;
          const detail =
            taskManager.tasks[currentProjectKey] && taskManager.tasks[currentProjectKey][taskType];
          const dbPath = taskManager.dbPath[currentProjectKey];
          return {
            key,
            title,
            icon,
            description,
            component: () => (
              <div className={styles.section}>
                <Component
                  taskType={taskType}
                  iife={iife}
                  api={api}
                  detail={detail}
                  dispatch={dispatch}
                  dbPath={dbPath}
                  Terminal={Terminal}
                  namespace={model.namespace}
                />
              </div>
            ),
          };
        })}
      />
    );
  };

  // model
  api.registerModel(model);

  api.addLocales({
    'es-ES': esES,
    'en-US': enUS,
  });

  const { FormattedMessage } = api.intl;

  const commonContent = [
    <a onClick={() => api.redirect('/tasks?type=block&active=build&iife=true')}>
      <FormattedMessage id="org.umi.ui.tasks.dashboard.build" />
    </a>,
    <a onClick={() => api.redirect('/tasks?type=block&active=lint&iife=true')}>
      <FormattedMessage id="org.umi.ui.tasks.dashboard.lint" />
    </a>,
  ];

  api.addDashboard({
    key: 'org.umi.dashboard.card.task',
    title: <FormattedMessage id="org.umi.ui.tasks.title" />,
    description: <FormattedMessage id="org.umi.ui.tasks.description" />,
    icon: <SettingOutlined />,
    content: api.mini
      ? commonContent
      : [
          <a onClick={() => api.redirect('/tasks?type=block&active=dev&iife=true')}>
            <FormattedMessage id="org.umi.ui.tasks.dashboard.dev" />
          </a>,
          ...commonContent,
        ],
  });

  api.addPanel({
    title: 'org.umi.ui.tasks.title',
    path: '/tasks',
    icon: <ProjectFilled />,
    component: api.connect(state => ({ taskManager: state[model.namespace] }))(TasksView),
  });
};
