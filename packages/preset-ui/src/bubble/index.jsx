import React from 'react';
import ReactDOM from 'react-dom';
import styled from 'styled-components';
import isMobile from 'is-mobile';
import { callRemote, init as initSocket } from './socket';
import { getLocale } from './utils';
import messages from './bubble-locale';
import Bubble from './Bubble';
import Modal from './Modal';
import Loading from './Loading';
import Error from './Error';
import ErrorBoundary from './ErrorBoundary';

const winPath = input => {
  if (!input) {
    return '';
  }
  const isExtendedLengthPath = /^\\\\\?\\/.test(input);

  if (isExtendedLengthPath) {
    return input;
  }

  return input.replace(/\\/g, '/');
};

const LoadingWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  color: #fff;
  height: 100%;
  font-size: 14px;
`;

class App extends React.Component {
  constructor(props) {
    super(props);
    const locale = getLocale();
    this.messageMap = new Map();
    this.state = {
      open: undefined,
      connected: false,
      uiLoaded: false,
      loading: false,
      currentProject: props.currentProject,
      locale,
      edit: false,
      editText: {},
      tips: '',
    };
    window.addEventListener('message', this.handleMessage, false);
    const { hostname, protocol } = window.location;
    const { port } = this.props;
    this.baseUrl = `${protocol}//${hostname}:${port}`;
  }

  handleLocale = locale => {
    this.setState({
      locale,
    });
  };

  componentDidUpdate() {
    const nextLocale = getLocale();
    if (this.state.locale !== nextLocale) {
      this.handleLocale(nextLocale);
    }
  }

  componentWillUnmount() {
    this.setState({
      tips: '',
    });
    window.removeEventListener('message', this.handleMessage, false);
  }

  getMiniUrl = () => {
    const { currentProject } = this.state;
    return `${this.baseUrl}/?mini&${
      currentProject && currentProject.key ? `&key=${currentProject.key}` : ''
    }`;
  };

  addTemplate = () => {
    const el = document.getElementById('umi-ui-bubble');
    if (el && el.contentWindow) {
      if (this.messageMap.get('template')) {
        el.contentWindow.postMessage(
          JSON.stringify({
            action: 'umi.ui.block.addTemplate',
            payload: this.messageMap.get('template'),
          }),
          '*',
        );
      }
    }
  };

  handleMessage = event => {
    try {
      const { action, payload = {} } = JSON.parse(event.data);
      switch (action) {
        case 'umi.ui.changeEdit': {
          this.setState({
            edit: true,
            editText: payload,
          });
          break;
        }

        case 'umi.ui.showMini': {
          this.toggleMiniOpen(true);
          break;
        }

        case 'umi.ui.hideMini': {
          this.toggleMiniOpen(false);
          break;
        }
        //
        case 'umi.ui.toggleIconLoading': {
          this.setState(({ loading }) => ({
            loading: !loading,
          }));
          break;
        }
        //
        case 'umi.ui.block.addTemplate': {
          this.toggleMiniOpen(true);
          this.messageMap.set('template', payload);
          //
          this.addTemplate();
          break;
        }
        case 'umi.ui.block.addTemplate.ready': {
          this.addTemplate();
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

  async componentDidMount() {
    const { path } = this.props;
    const message = this.getMessage();
    try {
      await initSocket(`${this.baseUrl}/umiui`, {
        onError: e => {
          // https://developer.mozilla.org/es-ES/docs/Web/API/CloseEvent
          //
          const { code } = e;
          this.setState({
            connected: false,
            tips: message[`code_${code}`] || '',
          });
        },
        onMessage: ({ type, payload }) => {
          //
          if (!payload || winPath(payload.projectPath) !== winPath(path)) return;

          switch (type) {
            case 'org.umi.ui.bubble.showLoading':
              this.setState({
                loading: true,
              });
              break;
            case 'org.umi.ui.bubble.hideLoading':
              this.setState({
                loading: false,
              });
              break;
            default:
              break;
          }
        },
      });
      this.setState({
        connected: true,
      });
    } catch (e) {
      console.error('Init socket failed', e);
      this.setState({
        connected: false,
      });
    }
  }

  initUIService = async () => {
    const { currentProject, path } = this.props;
    // console.log('currentProject', currentProject);
    if (this.state.connected) {
      // open iframe UmiUI
      if (!currentProject.key) {
        const res = await callRemote({
          type: '@@project/getKeyOrAddWithPath',
          payload: {
            path,
          },
        });
        this.setState({
          currentProject: res,
        });
      }
    }
  };

  closeModal = e => {
    e.stopPropagation();
    this.setState({
      open: false,
    });
  };

  onIframeLoad = () => {
    this.setState({
      uiLoaded: true,
    });
  };

  toggleMiniOpen = async open => {
    // or use toggle
    if (typeof this.state.open === 'undefined') {
      await this.initUIService();
    }
    if (open) {
      this.setState({
        open,
      });
    } else {
      this.setState(prevState => ({
        open: !prevState.open,
      }));
    }
  };

  resetEdit = () => {
    this.setState({
      edit: false,
      editText: {},
    });
  };

  getMessage = () => {
    const { locale } = this.state;
    return messages[locale] || messages['es-ES'];
  };

  render() {
    const { open, connected, uiLoaded, loading, locale, edit, editText, tips } = this.state;
    const { isBigfish = false } = this.props;
    const miniUrl = this.getMiniUrl();
    // get locale when first render
    // switch in the project can't be listened, the lifecycle can't be trigger
    // TODO: use Context but need to compatible with other React version
    const message = this.getMessage();

    return (
      <Bubble
        isBigfish={isBigfish}
        // TODO: loading when currentProject not loaded
        toggleMiniOpen={this.toggleMiniOpen}
        resetEdit={this.resetEdit}
        open={open}
        loading={loading}
        message={message}
        edit={edit}
        editText={editText}
        locale={locale}
      >
        {open !== undefined && (
          <Modal visible={open}>
            {!uiLoaded && !tips && (
              <LoadingWrapper>
                <Loading />
                <p style={{ marginTop: 8 }}>{message.loading}</p>
              </LoadingWrapper>
            )}
            {!connected ? (
              <Error message={message} tips={tips} isBigfish={isBigfish} />
            ) : (
              <iframe
                id="umi-ui-bubble"
                onLoad={this.onIframeLoad}
                style={{ width: '100%', height: '100%' }}
                // localhost maybe hard code
                src={miniUrl}
                frameBorder="0"
                scrolling="no"
                seamless="seamless"
                title="iframe_umi_ui"
              />
            )}
          </Modal>
        )}
      </Bubble>
    );
  }
}

const doc = window.document;
const node = doc.createElement('div');
doc.body.appendChild(node);

export default props => {
  if (!isMobile(navigator.userAgent)) {
    ReactDOM.render(
      <ErrorBoundary>
        <App {...props} />
      </ErrorBoundary>,
      node,
    );
  }
};
