import React, { useContext } from "react";
import TreeSelect, { CustomTreeSelectProps } from "../CustomTreeSelect";
import useCallData from "../hooks/useCallData";
import Context from "../UIApiContext";

const RoutePathTree: React.FC<{
  visible: boolean;
} & CustomTreeSelectProps> = props => {
  const { api } = useContext(Context);
  const { visible, ...restProps } = props;

  const { data: pageFoldersTreeData } = useCallData(
    async () => {
      if (visible) {
        return api.callRemote({
          type: "org.umi.block.pageFolders"
        });
      }
      return pageFoldersTreeData;
    },
    [visible],
    {
      defaultData: []
    }
  );

  return <TreeSelect treeData={pageFoldersTreeData} {...restProps} />;
};

export default RoutePathTree;
