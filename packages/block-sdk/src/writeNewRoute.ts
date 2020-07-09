import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import { winPath, createDebug } from '@umijs/utils';
import prettier from 'prettier';

const debug = createDebug('umi-build-dev:writeNewRoute');

/**
 * Write route to route file
 * @param {*} newRoute new routing configuration: {path, component, ...}
 * @param {*} configPath configuration path
 * @param {*} absSrcPath code path
 */
export function writeNewRoute(newRoute, configPath, absSrcPath) {
  const { code, routesPath } = getNewRouteCode(configPath, newRoute, absSrcPath);
  writeFileSync(routesPath, code, 'utf-8');
}

/**
 * Get the goal
 * @param {*} configPath
 * @param {*} newRoute
 */
export function getNewRouteCode(configPath, newRoute, absSrcPath) {
  debug(`find routes in configPath: ${configPath}`);
  const ast: any = parser.parse(readFileSync(configPath, 'utf-8'), {
    sourceType: 'module',
    plugins: ['typescript'],
  });
  let routesNode = null;
  const importModules = [];
  // Query whether the current configuration file exports the routes attribute
  traverse(ast, {
    Program({ node }) {
      // find import
      const { body } = node;
      body.forEach(item => {
        if (t.isImportDeclaration(item)) {
          const { specifiers } = item;
          const defaultEpecifier = specifiers.find(
            s => t.isImportDefaultSpecifier(s) && t.isIdentifier(s.local),
          );
          if (defaultEpecifier && t.isStringLiteral(item.source)) {
            importModules.push({
              identifierName: defaultEpecifier.local.name,
              modulePath: item.source.value,
            });
          }
        }
      });
    },
    AssignmentExpression({ node }) {
      // for exports.routes
      const { left, operator, right } = node;
      if (
        operator === '=' &&
        t.isMemberExpression(left) &&
        t.isIdentifier(left.object) &&
        left.object.name === 'exports' &&
        t.isIdentifier(left.property) &&
        left.property.name === 'routes'
      ) {
        routesNode = right;
      }
    },
    ExportDefaultDeclaration({ node }) {
      // export default []
      const { declaration } = node;
      if (t.isArrayExpression(declaration)) {
        routesNode = declaration;
      }
    },
    ObjectExpression({ node, parent }) {
      // find routes on object, like { routes: [] }
      if (t.isArrayExpression(parent)) {
        // children routes
        return;
      }
      const { properties } = node;
      properties.forEach((p: any) => {
        const { key, value } = p;
        if (t.isObjectProperty(p) && t.isIdentifier(key) && key.name === 'routes') {
          routesNode = value;
        }
      });
    },
  });

  if (routesNode) {
    // The routes configuration is not in the current file, you need to load the corresponding file export default {routes: pageRoutes} case 1
    if (!t.isArrayExpression(routesNode)) {
      const source = importModules.find(m => m.identifierName === routesNode.name);
      if (source) {
        const newConfigPath = getModulePath(configPath, source.modulePath, absSrcPath);
        return getNewRouteCode(newConfigPath, newRoute, absSrcPath);
      }
      throw new Error(`can not find import of ${routesNode.name}`);
    } else {
      // Configure in current file // export default {routes: []} case 2
      writeRouteNode(routesNode, newRoute);
    }
  } else {
    throw new Error('route array config not found.');
  }
  const code = generateCode(ast);
  debug(code, configPath);
  return { code, routesPath: configPath };
}

function getNewRouteNode(newRoute: any) {
  return (parser.parse(`(${JSON.stringify(newRoute)})`).program.body[0] as any).expression;
}

/**
 * Write node
 * @param {*} node
 * @param {*} newRoute new routing configuration
 */
export function writeRouteNode(targetNode, newRoute, currentPath = '/') {
  debug(`writeRouteNode currentPath newRoute.path: ${newRoute.path} currentPath: ${currentPath}`);
  const { elements } = targetNode;
  const paths = elements.map(ele => {
    if (!t.isObjectExpression(ele)) {
      return false;
    }
    const { properties } = ele;
    const redirect = properties.find((p: any) => p.key.name === 'redirect');
    if (redirect) {
      return false;
    }
    const pathProp: any = properties.find((p: any) => p.key.name === 'path');
    if (!pathProp) {
      return currentPath;
    }
    let fullPath = pathProp.value.value;
    if (fullPath.indexOf('/') !== 0) {
      fullPath = join(currentPath, fullPath);
    }
    return fullPath;
  });
  debug('paths', paths);

  const matchedIndex = paths.findIndex(p => p && newRoute.path.indexOf(winPath(p)) === 0);

  const newNode = getNewRouteNode(newRoute);
  if (matchedIndex === -1) {
    elements.push(newNode);
    // return container for test
    return targetNode;
  }
  // matched, insert to children routes
  const matchedEle = elements[matchedIndex];
  const routesProp = matchedEle.properties.find(
    p => p.key.name === 'routes' || (process.env.BIGFISH_COMPAT && p.key.name === 'childRoutes'),
  );
  if (!routesProp) {
    // not find children routes, insert before the matched element
    elements.splice(matchedIndex, 0, newNode);
    return targetNode;
  }
  return writeRouteNode(routesProp.value, newRoute, paths[matchedIndex]);
}

/**
 * Generate code
 * @param {*} ast
 */
function generateCode(ast) {
  const newCode = generate(ast, {}).code;
  return prettier.format(newCode, {
    // format same as ant-design-pro
    singleQuote: true,
    trailingComma: 'es5',
    printWidth: 100,
    parser: 'typescript',
  });
}

/**
 * Get the real path of the routing configuration
 * @param {*} modulePath
 */
function getModulePath(configPath, modulePath, absSrcPath) {
  // like @/route.config
  if (/^@\//.test(modulePath)) {
    modulePath = join(absSrcPath, modulePath.replace(/^@\//, ''));
  } else {
    modulePath = join(dirname(configPath), modulePath);
  }
  if (!/\.[j|t]s$/.test(modulePath)) {
    if (existsSync(`${modulePath}.js`)) {
      modulePath = `${modulePath}.js`;
    } else {
      modulePath = `${modulePath}.ts`;
    }
  }
  return modulePath;
}
