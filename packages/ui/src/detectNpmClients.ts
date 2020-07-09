import { join } from 'path';
import { existsSync, readFileSync, lstatSync } from 'fs';
import debug from './debug';

function haveFile(cwd, file) {
  return existsSync(join(cwd, file));
}

export default function(cwd) {
  if (!haveFile(cwd, 'package.json') || !haveFile(cwd, 'node_modules')) {
    return [];
  }

  const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf-8'));
  const deps = [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.devDependencies || {})];

  if (!deps.length) {
    return [];
  }

  if (haveFile(cwd, 'package-lock.json')) {
    return ['npm'];
  }

  if (haveFile(cwd, 'yarn.lock') && haveFile(cwd, 'node_modules/.yarn-integrity')) {
    const isAliRegistry = readFileSync(join(cwd, 'node_modules/.yarn-integrity'), 'utf-8').includes(
      'registry.npm.alibaba-inc.com',
    );
    if (isAliRegistry) {
      return ['ayarn', 'yarn'];
    }
    return ['tyarn', 'yarn'];
  }

  const depDir = join(cwd, 'node_modules', deps[0]);
  debug('depDir', depDir, deps);
  const isDepSymLink = lstatSync(depDir)?.isSymbolicLink?.();
  if (isDepSymLink) {
    if (process.env.BIGFISH_COMPAT) {
      return ['tnpm'];
    }
    return ['tnpm', 'cnpm', 'pnpm'];
  }

  return [];
}
