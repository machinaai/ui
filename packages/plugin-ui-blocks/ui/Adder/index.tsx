import React, { useState, useContext, useEffect } from 'react';
import { IUiApi } from '@machinaai/ui-types';
import { Modal, Select, Switch, Form, message } from 'antd';

import upperCamelCase from 'uppercamelcase';

import { AddBlockParams, Block, Resource } from '@machinaai/block-sdk/lib/data.d';
import Context from '../UIApiContext';
import useCallData from '../hooks/useCallData';
import LogPanel from '../LogPanel';
import ResultPanel from './ResultPanel';
import AddTemplateForm from './AddTemplateForm';
import AddBlockFormForUI from './AddBlockFormForUI';
import AddBlockForm from './AddBlockForm';
import { getPathFromFilename } from '../BlockList/BlockItem';
import { getNoExitVar, getNoExitRoute, getNoExitPath } from '../util';

interface AdderProps {
  onAddBlockChange?: (block: Block) => void;
  block: Block;
  visible?: boolean;
  blockType?: Resource['blockType'];
  onHideModal?: () => void;
  blockTarget?: string;
  path?: string;
  index?: number;
}

/**
 * @param api
 * @param params
 */
const addBlock = async (api: IUiApi, params: AddBlockParams) => {
  const { data: info = { message: '' } } = (await api.callRemote({
    type: 'org.umi.block.add',
    payload: params,
  })) as {
    data: {
      message: string;
      logs: string[];
    };
  };
  return info.message;
};

const cancelAddBlockTask = (api: IUiApi) =>
  api.callRemote({
    type: 'org.umi.block.cancel',
  });

const Adder: React.FC<AdderProps> = props => {
  const {
    visible,
    blockTarget,
    onAddBlockChange,
    onHideModal,
    index,
    block = { url: '' },
    blockType,
  } = props;
  const { api } = useContext(Context);
  const { callRemote, useIntl, _analyze } = api;
  const { formatMessage: intl } = useIntl();
  const { gtag } = _analyze;

  const [taskLoading, setTaskLoading] = useState<boolean>(false);

  const [fromCheck, setFromCheck] = useState<boolean>(false);

  const [form] = Form.useForm();

  const [addStatus, setAddStatus] = useState<'form' | 'log' | 'result'>('form');

  const [succeededBlock, setSucceededBlock] = useState<{
    previewUrl: string;
    name: string;
  }>(undefined);

  const { data: npmClients = [] } = useCallData(
    () =>
      callRemote({
        type: '@@project/getNpmClients',
      }) as any,
    [],
    {
      defaultData: ['npm'],
    },
  );

  useEffect(() => {
    if (api.detectNpmClients) {
      api.detectNpmClients().then(clients => {
        form.setFieldsValue({
          npmClient: clients.find(c => npmClients.includes(c)),
        });
      });
    }
  }, [npmClients]);

  useEffect(() => {
    api.listenRemote({
      type: 'org.umi.block.add-blocks-success',
      onMessage: msg => {
        setTaskLoading(false);
        onAddBlockChange(undefined);

        if (document.visibilityState !== 'hidden') {
          setAddStatus('result');
          setSucceededBlock(msg.data);
        } else {
          setAddStatus('form');
        }
        gtag('event', 'add-blocks-success', {
          event_category: 'block',
          event_label: msg.data && msg.data.path ? msg.data.path : '',
        });
      },
    });

    api.listenRemote({
      type: 'org.umi.block.add-blocks-fail',
      onMessage: msg => {
        setTaskLoading(false);
        onAddBlockChange(undefined);

        if (document.visibilityState !== 'hidden') {
          message.error(intl({ id: 'org.umi.ui.blocks.adder.failed' }));
        }
        gtag('event', 'add-blocks-fail', {
          event_category: 'block',
          event_label: msg.data && msg.data.path ? msg.data.path : '',
        });
      },
    });

    callRemote({
      type: 'org.umi.block.get-adding-block-url',
    }).then(({ data }: { data: string }) => {
      if (data) {
        setAddStatus('log');
        setTaskLoading(true);
      }
    });

    // detect language
    if (api.detectLanguage) {
      api.detectLanguage().then(language => {
        form.setFieldsValue({
          js: language === 'JavaScript',
        });
      });
    }
  }, []);

  useEffect(() => {
    if (!block) {
      return;
    }
    //  defaultName
    const defaultName = block?.url ? block?.url?.split('/')?.pop() : block?.key;
    const initPath = blockType !== 'template' ? '/' : `/${defaultName}`;
    console.log('initPath', initPath);
    const resetInitialValues = async () => {
      const noExitVar = await getNoExitVar({
        name: upperCamelCase(defaultName),
        path: blockTarget || initPath,
        api,
        need: !!blockTarget,
      });

      const initialValues = {
        path: await getNoExitPath({
          path: blockTarget || initPath,
          api,
          need: blockType === 'template',
        }),

        routePath: await getNoExitRoute({
          path: `/${defaultName.toLocaleLowerCase()}`,
          api,
          need: blockType === 'template',
        }),
        name: noExitVar,
      };
      form.setFieldsValue(initialValues);
    };
    resetInitialValues();
  }, [block?.url || block?.files, blockTarget || '']);

  useEffect(() => {
    if (index !== null && index !== undefined) {
      form.setFieldsValue({ index });
    }
  }, [index]);

  if (!block || (!block.url && !block.files)) {
    return null;
  }

  const initialValues = {
    js: false,
    uni18n: localStorage.getItem('umi-ui-block-removeLocale') === 'true',
    npmClient: 'npm',
  };

  const renderOkText = (status: 'form' | 'log' | 'result', loading: boolean) => {
    if (status === 'log' && !loading) {
      return intl({ id: 'org.umi.ui.blocks.adder.stop' });
    }
    if (status === 'log') {
      return intl({ id: 'org.umi.ui.blocks.adder.stop' });
    }
    return intl({ id: 'org.umi.ui.blocks.adder.ok' });
  };

  return (
    <Modal
      title={
        <div
          style={{
            display: 'flex',
          }}
        >
          {intl({ id: `org.umi.ui.blocks.adder.title.${blockType}` }, { name: block.name })}
        </div>
      }
      closable
      visible={visible}
      destroyOnClose
      onCancel={() => {
        onHideModal();
        if (!taskLoading) {
          setAddStatus('form');
        }
      }}
      footer={addStatus === 'result' ? null : undefined}
      confirmLoading={fromCheck}
      bodyStyle={{
        height: '60vh',
        overflow: 'auto',
        transition: '.3s',
      }}
      centered
      okText={renderOkText(addStatus, taskLoading)}
      onOk={() => {
        if (addStatus === 'log' && !taskLoading) {
          onHideModal();
          setAddStatus('form');
          setSucceededBlock(undefined);
          return;
        }
        if (addStatus === 'log') {
          Modal.confirm({
            title: intl({ id: 'org.umi.ui.blocks.adder.stop.title' }),
            content: intl({ id: 'org.umi.ui.blocks.adder.stop.content' }),
            okType: 'danger',
            okText: intl({ id: 'org.umi.ui.blocks.adder.stop.okText' }),
            cancelText: intl({ id: 'org.umi.ui.blocks.adder.stop.cancelText' }),
            onOk: async () => {
              await cancelAddBlockTask(api);
              setTaskLoading(false);
              onAddBlockChange(undefined);
            },
          });
          return;
        }

        // loading
        setTaskLoading(true);
        setFromCheck(true);

        form
          .validateFields()
          .then(async (values: any) => {
            setAddStatus('log');
            try {
              const params: AddBlockParams = {
                ...values,
                ...block,
                path: await getPathFromFilename(api, values.path),
                routePath: blockType === 'template' ? values.routePath : undefined,
                page: blockType === 'template',
                blockType,
                // support: l-${index} or ${index}
                index:
                  values.index && values.index.startsWith('l-')
                    ? values.index
                    : parseInt(values.index || '0', 10),
                name: blockType === 'template' ? block.name : values.name,
              };

              addBlock(api, params);
              localStorage.setItem('umi-ui-block-removeLocale', values.uni18n);
              onAddBlockChange(block);
              gtag('event', 'install-block', {
                event_category: 'block',
                event_label: params && params.path ? params.path : '',
              });
            } catch (error) {
              message.error(error.message);
            }
          })
          .catch(() => setTaskLoading(false))
          .finally(() => setFromCheck(false));
      }}
    >
      <Form
        hideRequiredMark
        initialValues={initialValues}
        layout="vertical"
        form={form}
        style={{
          display: addStatus !== 'form' && 'none',
        }}
      >
        {blockType === 'template' && <AddTemplateForm visible={visible} blockType={blockType} />}
        {blockType === 'block' && !api.isMini() && <AddBlockForm form={form} visible={visible} />}
        {blockType === 'block' && api.isMini() && (
          <AddBlockFormForUI form={form} blockTarget={blockTarget} />
        )}
        <Form.Item
          name="js"
          label={intl({ id: 'org.umi.ui.blocks.adder.js' })}
          valuePropName="checked"
        >
          <Switch size="small" />
        </Form.Item>

        {blockType === 'template' && (
          <Form.Item
            name="uni18n"
            label={intl({ id: 'org.umi.ui.blocks.adder.uni18n' })}
            valuePropName="checked"
          >
            <Switch size="small" />
          </Form.Item>
        )}
        <Form.Item
          name="npmClient"
          label={intl({ id: 'org.umi.ui.blocks.adder.npmClient' })}
          rules={[
            {
              required: true,
              message: intl({
                id: 'org.umi.ui.blocks.adder.npmClient.required',
              }),
            },
          ]}
        >
          <Select>
            {npmClients.map(client => (
              <Select.Option key={client} value={client}>
                {client}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="index">
          <input type="hidden" />
        </Form.Item>
      </Form>
      {addStatus === 'log' && <LogPanel loading={taskLoading} />}
      {addStatus === 'result' && succeededBlock && (
        <ResultPanel
          onFinish={() => {
            onHideModal();
            setAddStatus('form');
            setSucceededBlock(undefined);
            api.hideMini();
          }}
          name={succeededBlock.name || block.name}
          url={succeededBlock.previewUrl}
        />
      )}
    </Modal>
  );
};

export default Adder;
