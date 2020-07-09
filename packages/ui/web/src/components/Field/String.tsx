import React from 'react';
import { Form, Input } from 'antd';
import { useIntl } from 'react-intl';
import debug from '@/debug';
import { FieldProps } from './index';
import { getFormItemShow } from './utils';

const StringComp: React.SFC<FieldProps> = props => {
  const { formatMessage } = useIntl();
  const _log = debug.extend('Field:StringComp');
  const { name, form, size, ...restFormItemProps } = props;
  const { parentConfig } = getFormItemShow(name);
  const basicItem = {
    name,
    required: false,
    rules: [
      {
        required: !!form.getFieldValue(name),
        message: formatMessage({ id: 'org.umi.ui.configuration.string.required' }),
      },
    ],
    ...restFormItemProps,
  };

  const formControl = <Input size={size} autoComplete="off" style={{ maxWidth: 320 }} />;

  return parentConfig ? (
    <Form.Item shouldUpdate={(prev, curr) => prev[parentConfig] !== curr[parentConfig]} noStyle>
      {({ getFieldValue }) => {
        _log(
          'children field update',
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

export default StringComp;
