import React, { useState, useEffect, useMemo, useLayoutEffect } from 'react';
import { Spin, Radio, Button, message, Tooltip } from 'antd';
import { ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { IUiApi } from '@machinaai/ui-types';
import { Resource, Block, AddBlockParams } from '@machinaai/block-sdk/lib/data.d';
import { stringify, parse } from 'qs';

import { Clear } from './icon';
import BlockList from './BlockList';
import GlobalSearch from './GlobalSearch';
import useCallData from './hooks/useCallData';
import styles from './BlocksViewer.module.less';
import Adder from './Adder';
import AssetsMenu from './AssetsMenu';
import { ModelState, namespace } from './model';
import Container from './Container';

/**
 * get substr from url
 */
const getQueryConfig = () => parse(window.location.search.substr(1));

/**
 *  search
 * @param params
 */
const updateUrlQuery = (params: { type: string; resource?: string }) => {
  const defaultParas = getQueryConfig();
  window.history.pushState(
    {},
    '',
    `?${stringify({
      ...defaultParas,
      ...params,
    })}`,
  );
};

const clearCache = async (api: IUiApi) => {
  try {
    const hide = message.loading('Cache cleaning!');
    const { data } = (await api.callRemote({
      type: 'org.umi.block.clear',
    })) as {
      data: string;
    };

    //
    localStorage.removeItem('umi-ui-block-removeLocale');
    hide();
    //
    setTimeout(() => {
      message.success(data);
    }, 30);
  } catch (e) {
    message.error(e.message);
  }
};

const openUmiBlocks = () => {
  window.open('https://github.com/machinaai/umi-blocks');
};

/**
 * @param id
 * @param target
 */
export const scrollToById = (id: string, target: string) => {
  const dom = document.getElementById(id);
  const targetDom = document.getElementById(target);
  if (dom && targetDom) {
    const axis = dom.getBoundingClientRect();
    targetDom.scrollTop = axis.top + axis.height / 2;
  }
};

interface Props {
  dispatch: (params: any) => {};
  loading: boolean;
  block: ModelState;
}

/**
 * @param param0
 */
const renderActiveResourceTag = ({
  type,
  matchedResources = [],
  current = { id: '' },
  setActiveResource,
}: {
  type: string;
  current: Resource;
  matchedResources: Resource[];
  setActiveResource: (value: Resource) => void;
}) => {
  if (matchedResources.length > 1) {
    return (
      <Radio.Group
        value={current.id}
        size="small"
        onChange={e => {
          const resource = matchedResources.find(r => r.id === e.target.value);
          setActiveResource(resource);
          updateUrlQuery({ type, resource: resource.id });
        }}
      >
        {matchedResources.map(r => (
          <Radio.Button key={r.id} value={r.id}>
            {r.name}
          </Radio.Button>
        ))}
      </Radio.Group>
    );
  }
  if (matchedResources.length === 1) {
    return (
      <h3
        style={{
          marginTop: 8,
        }}
      >
        {matchedResources[0].name}
      </h3>
    );
  }
  return null;
};

const BlocksViewer: React.FC<Props> = props => {
  const { dispatch, block, loading: fetchDataLoading } = props;
  const { api, type, setType, activeResource, setActiveResource } = Container.useContainer();
  const { callRemote, useIntl } = api;
  const { formatMessage: intl } = useIntl();
  /**
   *
   */
  const isMini = api.isMini();

  /**
   *
   */
  const [willAddBlock, setWillAddBlock] = useState<Block>(null);
  const [addingBlock, setAddBlock] = useState<Block>(null);
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [blockParams, setBlockParams] = useState<AddBlockParams>(null);
  const [searchValue, setSearchValue] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  /**

   */
  useLayoutEffect(() => {
    if (type) {
      updateUrlQuery({ type });
    }
  }, []);

  const { data: resources } = useCallData<Resource[]>(
    () =>
      callRemote({
        type: 'org.umi.block.resource',
      }) as any,
    [],
    {
      defaultData: [],
    },
  );

  const current = activeResource || resources.filter(item => item.blockType === type)[0];

  const blocks = useMemo<Block[]>(
    () => (current && block.blockData[current.id] ? block.blockData[current.id] : []),
    [block, current],
  );

  useEffect(() => {
    if (current && current.id) {
      dispatch({
        type: `${namespace}/fetch`,
        payload: {
          resourceId: current.id,
        },
      });
    }
  }, [current]);

  useEffect(() => {
    /**

     */
    callRemote({
      type: 'org.umi.block.get-adding-block-url',
    }).then(({ data }: { data: string }) => {
      if (data) {
        setAddBlock({ url: data });
      }
    });
  }, []);

  useEffect(() => {
    const handleMessage = event => {
      try {
        const { action, payload = {} } = JSON.parse(event.data);
        switch (action) {
          case 'umi.ui.block.addTemplate': {
            setWillAddBlock(undefined);
            setBlockParams(undefined);
            if (payload) {
              setType('template');
              onShowModal(payload, {});
            }
            break;
          }
          default:
          // no thing
        }
      } catch (_) {
        // no thing
      }
      return false;
    };
    window.addEventListener('message', handleMessage, false);

    window.parent.postMessage(
      JSON.stringify({
        action: 'umi.ui.block.addTemplate.ready',
      }),
      '*',
    );
    return () => {
      window.removeEventListener('message', handleMessage, false);
    };
  }, []);

  useEffect(() => {
    if (willAddBlock) {
      scrollToById(willAddBlock.url, 'block-list-view');
    }
  }, [fetchDataLoading]);

  useEffect(() => {
    const buttonPadding = isMini ? '0 4px' : '0 8px';

    const handleSearchChange = (v: string) => {
      setSearchValue(v.toLocaleLowerCase());
    };

    if (api.setActionPanel) {
      api.setActionPanel(() => [
        <GlobalSearch key="global-search" onChange={handleSearchChange} api={api} />,
        <Tooltip
          title={intl({ id: 'org.umi.ui.blocks.actions.reload' })}
          getPopupContainer={node => (node ? (node.parentNode as HTMLElement) : document.body)}
          placement="bottom"
        >
          <Button
            size={isMini ? 'small' : 'default'}
            key="reload"
            style={{ padding: buttonPadding }}
            onClick={() => {
              dispatch({
                type: `${namespace}/fetch`,
                payload: {
                  reload: true,
                },
              });
            }}
          >
            <ReloadOutlined />
          </Button>
        </Tooltip>,
        <Tooltip
          title={intl({ id: 'org.umi.ui.blocks.actions.clear' })}
          getPopupContainer={node => (node ? (node.parentNode as HTMLElement) : document.body)}
          placement="bottom"
        >
          <Button
            size={isMini ? 'small' : 'default'}
            key="clear"
            onClick={() => clearCache(api)}
            style={{
              padding: buttonPadding,
            }}
          >
            <Clear />
          </Button>
        </Tooltip>,
        <Tooltip
          title={intl({ id: 'org.umi.ui.blocks.actions.submit' })}
          getPopupContainer={node => (node ? (node.parentNode as HTMLElement) : document.body)}
          placement="bottom"
        >
          <Button
            size={isMini ? 'small' : 'default'}
            key="clear"
            onClick={() => openUmiBlocks()}
            style={{
              padding: buttonPadding,
            }}
          >
            <PlusOutlined />
          </Button>
        </Tooltip>,
      ]);
    }
  }, [current]);

  const onShowModal = (currentBlock, option) => {
    setAddModalVisible(true);
    setWillAddBlock(currentBlock);
    setBlockParams(option);
  };

  const onHideModal = () => {
    setAddModalVisible(false);
    setWillAddBlock(undefined);
    setBlockParams(undefined);
  };

  const matchedResources = resources.filter(r => r.blockType === type);

  return (
    <>
      <div className={styles.wrapper}>
        <div className={styles.side}>
          <AssetsMenu
            type={type}
            matchedResources={matchedResources}
            setActiveResource={setActiveResource}
            updateUrlQuery={updateUrlQuery}
            setSelectedTag={setSelectedTag}
            selectedTag={selectedTag}
            current={current}
            blocks={blocks}
            loading={fetchDataLoading}
          />
        </div>
        <div className={styles.main}>
          <div className={`${styles.container} ${isMini && styles.min}`} id="block-list-view">
            {current ? (
              <div className={styles.blockList}>
                {matchedResources.length > 0 ? (
                  <BlockList
                    type={type}
                    keyword={searchValue}
                    addingBlock={willAddBlock || addingBlock}
                    list={blocks}
                    setSelectedTag={setSelectedTag}
                    selectedTag={selectedTag}
                    onShowModal={onShowModal}
                    loading={fetchDataLoading}
                  />
                ) : (
                  <div>No data source found</div>
                )}
              </div>
            ) : (
              <div className={styles.loading}>
                <Spin />
              </div>
            )}
          </div>
        </div>
      </div>
      <Adder
        block={willAddBlock}
        blockType={type}
        {...blockParams}
        visible={addModalVisible}
        onAddBlockChange={addBlock => setAddBlock(addBlock)}
        onHideModal={onHideModal}
      />
    </>
  );
};

export default BlocksViewer;
