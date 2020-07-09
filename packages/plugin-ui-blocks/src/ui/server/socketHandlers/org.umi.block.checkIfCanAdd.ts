import { existsSync } from 'fs';
import { join } from 'path';
import { IHandlerOpts } from '../index';

export default function({ success, payload, api, lang, failure }: IHandlerOpts) {
  const { item } = payload as {
    item: {
      features: string[];
    };
    type: string;
  };

  /**
   * Is there this feature tag
   * @param feature
   */
  function haveFeature(feature) {
    return item.features && item.features.includes(feature);
  }

  // Get the last generated route
  const configRoutes = Array.isArray(api.config?.routes) && api.config?.routes?.length > 0;
  // Does not support conventional routing
  if (!configRoutes) {
    failure({
      message:
        lang === 'es-ES'
          ? 'El bloque no soporta una ruta convencional, es necesario convertir a una ruta'
          : 'The block adding does not support the conventional route, please convert to a configuration route.',
    });
    return;
  }

  const payloadType = (payload as { type: string }).type === 'block' ? 'Block' : 'template';
  const isBigfish = !!process.env.BIGFISH_COMPAT;

  // Determine in advance whether there is package.json，If there is no error when adding a block
  if (!existsSync(join(api.cwd, 'package.json'))) {
    failure({
      message:
        lang === 'es-ES'
          ? `${payloadType}Add need to have in the project root directory package.json`
          : `package.json is required to add ${payloadType}`,
    });
    return;
  }
  const checkConfigRules = {
    dva: {
      enable: api.config?.dva,
      message: {
        'es-ES': isBigfish
          ? `${payloadType}Dependiendo de dva, habilite la configuración de dva.`
          : `${payloadType}El bloque depende de dva, es necesario isntalar @umijs/preset-react y habilitar dva`,
        'en-US': isBigfish
          ? ''
          : 'Block depends on dva, please install @umijs/preset-react and enable dva.',
      },
    },
    i18n: {
      enable: api.config.locale,
      message: {
        'es-ES': isBigfish
          ? `${payloadType}`
          : `${payloadType}El bloque depende de i18n, es necesario instalar @umijs/preset-react y habilitar locale`,
        'en-US': isBigfish
          ? ''
          : 'Block depends on i18n, please install @umijs/preset-react and enable locale.',
      },
    },
  };

  Object.keys(checkConfigRules).forEach(rule => {
    if (haveFeature(rule) && checkConfigRules[rule] && !checkConfigRules[rule].enable) {
      failure({
        message: checkConfigRules[rule].message[lang] || checkConfigRules[rule].message['es-ES'],
      });
      return false;
    }
  });

  success({ data: true, success: true });
}
