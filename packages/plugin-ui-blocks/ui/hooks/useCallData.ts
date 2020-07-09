import { useState, useEffect } from "react";
import { message as antdMessage } from "antd";

const useCallData = <T, U = {}>(
  getData: (params: {
    pageSize: number;
    pageIndex: number;
  }) => Promise<{ data: T; success: boolean; message?: string }>,
  effects?: any[],
  options?: {
    defaultData?: T;
    manual?: boolean;
    fetchMore?: {
      pageSize?: number;
    };
  }
): {
  data: T;
  loading: boolean;
  hasMore: boolean;
  fetch: () => void;
  fetchMore: () => void;
  setList: (data: T) => void;
} => {
  const [list, setList] = useState<T>(options.defaultData as any);
  const [loading, setLoading] = useState<boolean>(true);
  const [pageIndex, setPageIndex] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const { manual = false } = options || {};
  const { pageSize = 20 } =
    options && options.fetchMore ? options.fetchMore : {};
  const fetchList = async (isAppend?: boolean) => {
    setLoading(true);
    const { data, success, message } = await getData({
      pageIndex,
      pageSize
    });
    if (success !== false) {
      if (isAppend && list) {
        const newList = {
          ...data
        };
        Object.keys(data || {}).forEach(key => {
          if (Array.isArray(data[key]) && list[key]) {
            newList[key] = list[key].concat(data[key]);
          }
        });
        setList(newList);
      } else {
        setList(data);
      }

      let totalCount = 0;
      Object.keys(data || {}).forEach(key => {
        if (/total\S+Count/.test(key) && typeof data[key] === "number") {
          totalCount = data[key];
        }
      });
      if (totalCount > pageSize * pageIndex) {
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } else {
      antdMessage.error(message);
    }
    setLoading(false);
  };

  const fetchMore = () => {
    setPageIndex(pageIndex + 1);
    fetchList(true);
  };

  useEffect(() => {
    if (manual === false) {
      fetchList();
    }
  }, effects || []);
  return {
    data: list,
    loading,
    fetch: fetchList,
    fetchMore,
    hasMore,
    setList
  };
};

export default useCallData;
