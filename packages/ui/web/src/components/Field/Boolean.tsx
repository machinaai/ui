import * as React from 'react';
import { Form, Switch } from 'antd';
import isPlainObject from 'lodash/isPlainObject';
import debug from '@/debug';
import { FieldProps } from './index';
import { getFormItemShow } from './utils';

const BooleanComp: React.SFC<FieldProps> = props => {
  const _log = debug.extend('Field:BooleanComp');
  const { name, form, size, ...restFormItemProps } = props;
  const { parentConfig } = getFormItemShow(name);
  const basicItem = {
    name,
    valuePropName: 'checked',
    normalize: (value: boolean | object) => !!value,
    ...restFormItemProps,
  };

  React.useEffect(() => {
    const initVal = form.getFieldValue(name);
    form.setFieldsValue({
      [name]: initVal === true || !!isPlainObject(initVal),
    });
  }, []);

  const formControl = <Switch size={size as any} />;

  return parentConfig ? (
    <Form.Item noStyle shouldUpdate={(prev, curr) => prev[parentConfig] !== curr[parentConfig]}>
      {({ getFieldValue }) => {
        _log(
          'BooleanComp children field update',
          name,
          parentConfig,
          getFieldValue(name),
          getFieldValue(parentConfig),
        );
        const parentValue = getFieldValue(parentConfig);
        const isShow = typeof parentValue === 'undefined' || !!parentValue;
        return (
          isShow && (
            <Form.Item {...basicItem} dependencies={[parentConfig]}>
              {formControl}
            </Form.Item>
          )
        );
      }}
    </Form.Item>
  ) : (
    <Form.Item {...basicItem}>{formControl}</Form.Item>
  );
};

export default BooleanComp;
