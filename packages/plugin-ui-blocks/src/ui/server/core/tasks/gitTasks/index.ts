import parseUrl from './parse_url';
import gitClone from './git_clone';
import gitUpdate from './git_update';
import install from './install';
import runGenerator from './run_generator';
import writeRoutes from './write_routes';

export default [
  { name: 'parseUrl', task: parseUrl },
  { name: 'gitClone', task: gitClone },
  { name: 'gitUpdate', task: gitUpdate },
  { name: 'install', task: install },
  { name: 'runGenerator', task: runGenerator },
  { name: 'writeRoutes', task: writeRoutes },
];
