import { existsSync } from 'fs';
import { join } from 'path';

export default function(cwd, { routeComponents }) {
  if (process.env.DETECT_LANGUAGE) {
    return process.env.DETECT_LANGUAGE;
  }

  if (!existsSync(join(cwd, 'tsconfig.json'))) return 'JavaScript';

  const tsFiles = routeComponents.filter(rc => rc.endsWith('.ts') || rc.endsWith('.tsx'));
  if (tsFiles.length > routeComponents.length / 2) {
    return 'TypeScript';
  }
  return 'JavaScript';
}
