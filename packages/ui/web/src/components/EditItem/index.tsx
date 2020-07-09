import * as React from 'react';
import { CheckOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import { Tooltip, Input } from 'antd';
import cls from 'classnames';

import styles from './index.less';

const { useState } = React;

interface EditItemProps {
  children: string;
  title?: string;
  onClick: (val: string) => void;
  className?: string;
}

const EditItem: React.SFC<EditItemProps> = props => {
  const { children = '', title = 'editar', onClick, className } = props;

  const [isEdit, setEdit] = useState<boolean>(false);
  const [editVal, setEditValue] = useState<string>(children);

  if (!children) return null;
  const handleChange = e => {
    const { value } = e.target;
    setEditValue(value);
  };

  const handleClose = () => {
    setEdit(false);
    setEditValue(children);
  };

  const handleClick = () => {
    try {
      onClick(editVal);
      setEdit(false);
    } catch (e) {
      setEditValue(children);
    }
  };

  const textCls = cls(styles.text, className);

  return (
    <span className={textCls}>
      {isEdit ? (
        <>
          <Input defaultValue={children} onChange={handleChange} />
          <CheckOutlined onClick={handleClick} />
          <CloseOutlined onClick={handleClose} />
        </>
      ) : (
        <>
          {children}
          <Tooltip title={title}>
            <EditOutlined onClick={() => setEdit(true)} />
          </Tooltip>
        </>
      )}
    </span>
  );
};

export default EditItem;
