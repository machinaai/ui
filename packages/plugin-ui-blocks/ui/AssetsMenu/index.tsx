import React, { useMemo, useContext } from "react";
import { UpOutlined, DownOutlined } from "@ant-design/icons";
import cls from "classnames";
import { Spin } from "antd";
import styles from "./index.module.less";
import Context from "../UIApiContext";

export default props => {
  const {
    type,
    matchedResources,
    current,
    setActiveResource,
    updateUrlQuery,
    blocks,
    selectedTag,
    setSelectedTag,
    loading
  } = props;
  const { api } = useContext(Context);
  const { uniq, flatten } = api._;

  const tags: string[] = useMemo<string[]>(
    () =>
      uniq(
        flatten(
          blocks.map(item => (item.category ? [item.category] : item.tags))
        )
      ),
    [blocks]
  );

  function renderCats() {
    if (loading) {
      return (
        <div className={`${styles.cats} ${loading ? styles.catsLoading : ""}`}>
          <Spin size="large" />
        </div>
      );
    }
    const getTagCls = selected =>
      cls(styles.cat, {
        [styles.current]: selectedTag === selected
      });
    return (
      <div className={styles.cats}>
        <div key="All" className={getTagCls("")} onClick={() => setSelectedTag("")}>
          All
        </div>
        {tags
          // .sort(sortTag)
          .filter(tag => tag !== "Abandoned")
          .map(tag => (
            <div key={tag} className={getTagCls(tag)} onClick={() => setSelectedTag(tag)}>
              {tag}
            </div>
          ))}
      </div>
    );
  }

  function renderResources() {
    function resourceSwitchHandler(r) {
      if (r.id === current.id) {
        setActiveResource({ id: null });
        return;
      }
      setActiveResource(r);
      updateUrlQuery({ type, resource: r.id });
    }

    return matchedResources.map(r => {
      const isCurrent = current.id === r.id;
      const resourceCls = cls(styles.resource, {
        [styles.current]: !!isCurrent
      });
      return (
        <React.Fragment key={r.id}>
          <div className={resourceCls} onClick={resourceSwitchHandler.bind(null, r)}>
            <div className={styles.icon}>
              <img src={r.icon} style={{ width: "32px", height: "32px" }} />
            </div>
            <div className={styles.titleAndDescription}>
              <div className={styles.title}>{r.name}</div>
              <div className={styles.description}>{r.description}</div>
            </div>
            <div className={styles.switcher}>
              {isCurrent ? (
                <UpOutlined style={{ fontSize: "12px" }} />
              ) : (
                <DownOutlined style={{ fontSize: "12px" }} />
              )}
            </div>
          </div>
          {isCurrent ? renderCats() : null}
        </React.Fragment>
      );
    });
  }

  return <>{renderResources()}</>;
};
