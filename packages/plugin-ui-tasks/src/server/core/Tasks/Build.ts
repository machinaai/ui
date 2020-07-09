import { join } from 'path';
import { BaseTask, ITaskOptions } from './Base';
import { TaskType, TaskState } from '../enums';
import { parseScripts, runCommand, getBuildAnalyzeEnv, getChartData } from '../../util';

const STATS_FILE_NAME = 'webpack-stats-build.json';

export class BuildTask extends BaseTask {
  private dbPath: string; //
  private webpackStats: any;

  constructor(opts: ITaskOptions) {
    super(opts);
    this.type = TaskType.BUILD;
  }

  public async run(args, env: any = {}) {
    this.webpackStats = null;
    await super.run();
    const { script, envs: scriptEnvs } = this.getScript();

    const analyzeEnv = await getBuildAnalyzeEnv({
      analyze: args.analyze,
      dbPath: args.dbPath,
      fileName: STATS_FILE_NAME,
    });

    this.proc = await runCommand(script, {
      cwd: this.cwd,
      env: {
        ...env,
        ...analyzeEnv,
        ...scriptEnvs,
      },
    });

    this.handleChildProcess(this.proc);
    //
    this.proc.on('message', msg => {
      if (this.state !== TaskState.ING) {
        return;
      }
      const { type } = msg;
      if (type === 'STARTING') {
        this.updateProgress(msg);
      }
    });
  }

  public async getDetail(dbPath: string) {
    if (dbPath) {
      this.dbPath = dbPath;
    }
    return {
      ...(await super.getDetail()),
      progress: this.progress,
      stats: await this.getStats(),
    };
  }

  public async getStats() {
    if (this.state !== TaskState.SUCCESS || !this.dbPath) {
      return null;
    }
    if (this.webpackStats) {
      return this.webpackStats;
    }
    this.webpackStats = getChartData(join(this.dbPath, STATS_FILE_NAME));
    return this.webpackStats;
  }

  private getScript(): { script: string; envs: object } {
    const { succes, exist, errMsg, envs, bin, args } = parseScripts({
      pkgPath: this.pkgPath,
      key: 'build',
    });

    if (!exist) {
      return {
        script: this.isBigfishProject ? 'bigfish build' : 'umi build',
        envs: [],
      };
    }
    if (!succes) {
      this.error(errMsg);
    }
    return {
      script: `${bin} ${args.join(' ')}`,
      envs,
    };
  }
}
