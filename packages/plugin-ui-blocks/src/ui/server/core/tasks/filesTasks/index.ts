import parseUrl from './parse_url';
import install from './install';
import runGenerator from './run_generator';
import writeRoutes from './write_routes';

/**
 * files: {},
 * dependencies: {},
 * devDependencies: {}
 */
export default [
  { name: 'parseUrl', task: parseUrl },
  { name: 'install', task: install },
  { name: 'runGenerator', task: runGenerator },
  { name: 'writeRoutes', task: writeRoutes },
];
