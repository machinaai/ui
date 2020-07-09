import * as React from 'react';
import { Result, Button } from 'antd';
import Context from '@/layouts/Context';
import LightNoFound from '@/components/LightNoFound';
import DarkNoFound from '@/components/DarkNoFound';

import styles from './404.less';

const NotFound: React.SFC<{}> = props => {
  const { theme } = React.useContext(Context);

  return (
    <Result
      className={styles.notFound}
      title="404"
      subTitle="Lo sentimos, la página que visitaste no existe"
      icon={theme === 'dark' ? <DarkNoFound /> : <LightNoFound />}
      extra={
        <Button
          type="primary"
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Volver arriba
        </Button>
      }
    />
  );
};

export default NotFound;
