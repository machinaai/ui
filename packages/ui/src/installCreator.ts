import mkdirp from 'mkdirp';
import { homedir } from 'os';
import resolveFrom from 'resolve-from';
import { join } from 'path';
import { existsSync, writeFileSync } from 'fs';
import { executeCommand } from './npmClient';

interface IOpts {
  npmClient?: string;
  packageName?: string;
  baseDir?: string;
  onData?: () => {};
}

export default async function(opts: IOpts) {
  const { npmClient = 'npm', packageName = 'create-umi', onData } = opts;

  const baseDir = opts.baseDir || join(homedir(), `.umi/creator/${packageName}`);
  mkdirp.sync(baseDir);

  //  package.json
  const pkgPath = join(baseDir, 'package.json');
  if (existsSync(pkgPath)) {
    await executeCommand(
      require(pkgPath).npmClient, // eslint-disable-line
      ['update', '--registry=https://registry.npm.taobao.org'],
      baseDir,
      {
        unsafePerm: true,
        onData,
      },
    );
  } else {
    //  package.json
    writeFileSync(
      pkgPath,
      JSON.stringify(
        {
          npmClient,
          dependencies: {
            [packageName]: '*',
          },
        },
        null,
        2,
      ),
      'utf-8',
    );
    //
    await executeCommand(
      npmClient,
      ['install', '--registry=https://registry.npm.taobao.org'],
      baseDir,
      {
        unsafePerm: true,
        onData,
      },
    );
  }

  return resolveFrom(baseDir, packageName);
}
