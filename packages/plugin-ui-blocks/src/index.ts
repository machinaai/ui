import { IApi } from 'umi';

export default (api: IApi) => {
  // Register block ui
  // The ui function is not activated in the following scenarios:
  // 1. ssr time
  // 2. When not dev or ui
  const [command] = process.argv.slice(2);
  if (
    process.env.UMI_UI !== 'none' &&
    !api.userConfig.ssr &&
    (command === 'dev' || command === 'ui')
  ) {
    require('./ui/index').default(api);
  }
};
