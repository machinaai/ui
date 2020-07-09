import { dirname, join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execa } from '@umijs/utils';
import assert from 'assert';
import sortPackageJson from 'sort-package-json';
import {
  dependenciesConflictCheck,
  getMockDependencies,
  getAllBlockDependencies,
} from './getBlockGenerator';

/**
 * Dependency conversion from array to object
 * @param {*} templateTmpDirPath
 */
const depsArrayToObject = loc =>
  loc
    .map(dep => ({ [dep[0]]: dep[1] }))
    .reduce(
      (pre, next) => ({
        ...pre,
        ...next,
      }),
      {},
    );

/**
 * Install dependent packages
 * -Get project path
 * -Recursively obtain dependencies.
 * -Call npm to merge installation dependencies
 * @param {*} param0
 * @param {*} ctx
 */
export async function installDependencies(
  {
    npmClient,
    registry,
    applyPlugins,
    ApplyPluginsType,
    paths,
    debug,
    dryRun,
    spinner,
    skipDependencies,
    execa: selfExeca,
  }: any,
  ctx,
) {
  const exec = selfExeca || execa;

  // read project package.json
  const projectPkgPath = await applyPlugins({
    key: '_modifyBlockPackageJSONPath',
    type: ApplyPluginsType.modify || 'modify',
    initialValue: join(paths.cwd, 'package.json'),
  });

  // Determine if package.json exists
  assert(existsSync(projectPkgPath), `No package.json found in your project`);

  // eslint-disable-next-line
  const projectPkg = require(projectPkgPath);

  // get _mock.js dependencie
  let mockDevDependencies = {};
  const mockFilePath = join(ctx.sourcePath, 'src/_mock.js');
  if (existsSync(mockFilePath)) {
    mockDevDependencies = getMockDependencies(readFileSync(mockFilePath, 'utf-8'), ctx.pkg);
  }
  const allBlockDependencies = getAllBlockDependencies(ctx.templateTmpDirPath, ctx.pkg);
  // Construct the execution parameters of _modifyBlockDependencies
  const initialValue = dependenciesConflictCheck(
    allBlockDependencies,
    projectPkg.dependencies,
    mockDevDependencies,
    {
      ...projectPkg.devDependencies,
      ...projectPkg.dependencies,
    },
  );
  // get conflict dependencies and lack dependencies
  const { conflicts, lacks, devConflicts, devLacks } = await applyPlugins({
    key: '_modifyBlockDependencies',
    type: ApplyPluginsType?.modify || 'modify',
    initialValue,
  });
  debug(
    `conflictDeps ${conflicts}, lackDeps ${lacks}`,
    `devConflictDeps ${devConflicts}, devLackDeps ${devLacks}`,
  );

  // find conflict dependencies throw error
  const allConflicts = [...conflicts, ...devConflicts];
  const ErrorInfo = allConflicts
    .map(info => `* ${info[0]}: ${info[2]}(your project) not compatible with ${info[1]}(block)`)
    .join('\n');
  // If there is a conflict, the process of throwing an error ends.
  if (allConflicts.length) {
    throw new Error(`find dependencies conflict between block and your project:${ErrorInfo}`);
  }

  // find lack conflict, auto install
  if (dryRun) {
    debug('dryRun is true, skip install dependencies');
    return;
  }

  if (skipDependencies) {
    // Intermediate layer conversion
    // [["react","16.5"]] => {"react":16.5}
    const dependencies = depsArrayToObject(lacks);
    const devDependencies = depsArrayToObject(devLacks);

    // format package.json
    const content = JSON.stringify(
      sortPackageJson({
        ...projectPkg,
        dependencies: { ...dependencies, ...projectPkg.dependencies },
        devDependencies: { ...devDependencies, ...projectPkg.devDependencies },
      }),
      null,
      2,
    );
    // Write file
    writeFileSync(projectPkgPath, content);
    return;
  }

  // Install dependencies
  if (lacks.length) {
    const deps = lacks.map(dep => `${dep[0]}@${dep[1]}`);
    spinner.start(
      `📦  Install additional dependencies ${deps.join(
        ',',
      )} with ${npmClient} --registry ${registry}`,
    );
    try {
      let npmArgs = npmClient.includes('yarn') ? ['add'] : ['install', '-d'];
      npmArgs = [...npmArgs, ...deps, `--registry=${registry}`];

      // There is no need to install puppeteer when installing blocks, because yarn will install all dependencies at once.
      // Add an environment variable to avoid it
      await exec(npmClient, npmClient.includes('yarn') ? npmArgs : [...npmArgs, '--save'], {
        cwd: dirname(projectPkgPath),
        env: {
          ...process.env,
          // ref  https://github.com/GoogleChrome/puppeteer/blob/411347cd7bb03edacf0854760712d32b0d9ba68f/docs/api.md#environment-variables
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true,
        },
      });
    } catch (e) {
      spinner.fail();
      throw new Error(e);
    }
    spinner.succeed();
  }

  if (devLacks.length) {
    // need skip devDependency which already install in dependencies
    const devDeps = devLacks
      .filter(dep => !lacks.find(item => item[0] === dep[0]))
      .map(dep => `${dep[0]}@${dep[1]}`);
    spinner.start(
      `Install additional devDependencies ${devDeps.join(
        ',',
      )} with ${npmClient}  --registry ${registry}`,
    );
    try {
      let npmArgs = npmClient.includes('yarn') ? ['add'] : ['install'];
      npmArgs = [...npmArgs, ...devDeps, `--registry=${registry}`];
      await exec(npmClient, npmClient.includes('yarn') ? npmArgs : [...npmArgs, '--save-dev'], {
        cwd: dirname(projectPkgPath),
      });
    } catch (e) {
      spinner.fail();
      throw new Error(e);
    }
    spinner.succeed();
  }
}

export async function installFilesDependencies(
  {
    npmClient,
    registry,
    applyPlugins,
    ApplyPluginsType,
    paths,
    dryRun,
    debug,
    spinner,
    skipDependencies,
    execa: selfExeca,
    args = {},
  }: any,
  ctx,
) {
  const exec = selfExeca || execa;
  debug('files tasks - install');

  // read project package.json
  const projectPkgPath = await applyPlugins({
    key: '_modifyBlockPackageJSONPath',
    type: ApplyPluginsType.modify || 'modify',
    initialValue: join(paths.cwd, 'package.json'),
  });

  assert(existsSync(projectPkgPath), `No package.json found in your project`);

  // eslint-disable-next-line
  const projectPkg = require(projectPkgPath);

  // get _mock.js dependencie
  const { dependencies: allBlockDependencies = {}, devDependencies = {} } = ctx.pkg;

  const initialValue = dependenciesConflictCheck(
    allBlockDependencies,
    projectPkg.dependencies,
    devDependencies,
    {
      ...projectPkg.devDependencies,
      ...projectPkg.dependencies,
    },
  );
  // get conflict dependencies and lack dependencies
  const { conflicts, lacks, devConflicts, devLacks } = await applyPlugins({
    key: '_modifyBlockDependencies',
    type: ApplyPluginsType?.modify || 'modify',
    initialValue,
  });
  debug(
    `conflictDeps ${conflicts}, lackDeps ${lacks}`,
    `devConflictDeps ${devConflicts}, devLackDeps ${devLacks}`,
  );

  // find conflict dependencies throw error
  const allConflicts = [...conflicts, ...devConflicts];
  const ErrorInfo = allConflicts
    .map(info => `* ${info[0]}: ${info[2]}(your project) not compatible with ${info[1]}(block)`)
    .join('\n');

  if (allConflicts.length) {
    throw new Error(`find dependencies conflict between block and your project:${ErrorInfo}`);
  }

  // find lack conflict, auto install
  if (dryRun) {
    debug('dryRun is true, skip install dependencies');
    return;
  }

  if (lacks.length) {
    const deps = lacks.map(dep => `${dep[0]}@${dep[1]}`);
    spinner.start(
      `📦  Install additional dependencies ${deps.join(
        ',',
      )} with ${npmClient} --registry ${registry}`,
    );
    try {
      let npmArgs = npmClient.includes('yarn') ? ['add'] : ['install', '-d'];
      npmArgs = [...npmArgs, ...deps, `--registry=${registry}`];

      await exec(npmClient, npmClient.includes('yarn') ? npmArgs : [...npmArgs, '--save'], {
        cwd: dirname(projectPkgPath),
        env: {
          ...process.env,
          // ref  https://github.com/GoogleChrome/puppeteer/blob/411347cd7bb03edacf0854760712d32b0d9ba68f/docs/api.md#environment-variables
          PUPPETEER_SKIP_CHROMIUM_DOWNLOAD: true,
        },
      });
    } catch (e) {
      spinner.fail();
      throw new Error(e);
    }
    spinner.succeed();
  }

  if (devLacks.length) {
    // need skip devDependency which already install in dependencies
    const devDeps = devLacks
      .filter(dep => !lacks.find(item => item[0] === dep[0]))
      .map(dep => `${dep[0]}@${dep[1]}`);
    spinner.start(
      `Install additional devDependencies ${devDeps.join(
        ',',
      )} with ${npmClient}  --registry ${registry}`,
    );
    try {
      let npmArgs = npmClient.includes('yarn') ? ['add'] : ['install'];
      npmArgs = [...npmArgs, ...devDeps, `--registry=${registry}`];
      await exec(npmClient, npmClient.includes('yarn') ? npmArgs : [...npmArgs, '--save-dev'], {
        cwd: dirname(projectPkgPath),
      });
    } catch (e) {
      spinner.fail();
      throw new Error(e);
    }
    spinner.succeed();
  }
}
