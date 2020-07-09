import { IApi } from 'umi';

export default (api: IApi) => {
  const injectBubble = process.env.NODE_ENV === 'development' && !api.userConfig.ssr;
  if (process.env.UMI_UI === 'none') {
    return {
      plugins: [],
    };
  }

  return {
    plugins: [
      require.resolve('./registerMethods'),
      require.resolve('./UmiUIFlag'),
      require.resolve('./commands/ui'),
      ...(injectBubble ? [require.resolve('./addBubble')] : []),
      require.resolve('./plugins/dashboard/index'),

      // require.resolve('./plugins/configuration/index'),
      require.resolve('@machinaai/plugin-ui-tasks'),
      require.resolve('@machinaai/plugin-ui-blocks'),
    ],
  };
};
