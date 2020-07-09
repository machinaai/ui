import {
  callRemote,
  listenRemote,
  getTerminalRefIns,
  getNoticeMessage,
  intl,
  notify,
  runTask,
  cancelTask,
  getTaskDetail,
  Analyze,
} from '../util';
import { TaskType, TaskState } from '../../src/server/core/enums';

export const namespace = 'org.umi.taskManager';

let init = false;

export default {
  namespace,
  state: {
    currentProject: {},
    tasks: {}, // [cwd]: { dev: DevTask, build: BuildTask, ... }
    dbPath: {}, // [cwd]: 'dbPath'
  },
  effects: {
    //  taskManager
    *init({ payload, callback }, { call, put }) {
      const { currentProject, getSharedDataDir } = payload;
      const { states: taskStates } = yield callRemote({
        type: 'plugin/init',
        payload: {
          key: currentProject.key,
        },
      });
      const dir = yield getSharedDataDir();
      yield put({
        type: 'initCurrentProjectState',
        payload: {
          currentProject,
          taskStates,
          dbPath: dir,
        },
      });
    },
    //
    *exec({ payload }, { call }) {
      const { taskType, args, env } = payload;
      yield call(runTask, taskType, args, env);
    },
    //
    *cancel({ payload }, { call }) {
      const { taskType } = payload;
      yield call(cancelTask, taskType);
    },

    *getTaskDetail({ payload }, { put, call }) {
      const { taskType, callback, log, dbPath } = payload;
      const result = yield call(getTaskDetail, taskType, log, dbPath);
      callback && callback(result);
      yield put({
        type: 'updateWebpackStats',
        payload: result,
      });
    },

    //
    *writeLog({ payload }, { select }) {
      const { taskType, log, key: projectKey } = payload;
      const modal = yield select(state => state[namespace]);
      const key = modal && modal.currentProject && modal.currentProject.key;
      if (!key) {
        return;
      }
      const ins = getTerminalRefIns(taskType, projectKey);
      if (!ins) {
        return;
      }
      ins.write(log.replace(/\n/g, '\r\n'));
    },
  },
  reducers: {
    initCurrentProjectState(state, { payload }) {
      const { currentProject, taskStates, dbPath } = payload;
      return {
        ...state,
        currentProject,
        tasks: {
          ...state.tasks,
          [currentProject.path]: taskStates,
        },
        dbPath: {
          ...state.dbPath,
          [currentProject.path]: dbPath,
        },
      };
    },
    updateTaskDetail(state, { payload }) {
      const { taskType, detail, cwd } = payload;
      const { stats, ...rest } = detail;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [cwd]: {
            ...state.tasks[cwd],
            [taskType]: {
              ...state.tasks[cwd][taskType],
              ...rest,
              analyze: stats ? new Analyze(stats) : null,
            },
          },
        },
      };
    },
    updateWebpackStats(state, { payload }) {
      const { currentCwd, stats, type } = payload;
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [currentCwd]: {
            ...state.tasks[currentCwd],
            [type]: {
              ...state.tasks[currentCwd][type],
              analyze: stats ? new Analyze(stats) : null, //  stats,  analyze instance
            },
          },
        },
      };
    },
  },
  subscriptions: {
    setup({ history, dispatch }) {
      history.listen(({ pathname }) => {
        if (init) {
          return;
        }
        if (pathname === '/tasks') {
          init = true;
          //
          listenRemote({
            type: 'org.umi.task.state',
            onMessage: ({ detail, taskType, cwd }) => {
              dispatch({
                type: 'updateTaskDetail',
                payload: {
                  detail,
                  taskType,
                  cwd,
                },
              });

              if ([TaskState.INIT, TaskState.ING].indexOf(detail.state) > -1) {
                return;
              }
              const { title, message, ...rest } = getNoticeMessage(taskType, detail.state);
              // TODO:
              notify({
                title: intl.formatMessage({ id: title }),
                message: intl.formatMessage({ id: message }),
                ...rest,
              });
            },
          });
          //
          listenRemote({
            type: 'org.umi.task.log',
            onMessage: ({
              log = '',
              taskType,
              key,
            }: {
              log: string;
              taskType: TaskType;
              key: string;
            }) => {
              if (!log) {
                return;
              }
              dispatch({
                type: 'writeLog',
                payload: {
                  taskType,
                  log,
                  key,
                },
              });
            },
          });
        }
      });
    },
  },
};
