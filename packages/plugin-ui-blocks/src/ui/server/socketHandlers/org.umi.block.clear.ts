import { clearGitCache } from '@machinaai/block-sdk';
import { IHandlerOpts } from '../index';

export default function({ payload, success }: IHandlerOpts) {
  const info = clearGitCache(payload);
  success({
    data: info,
    success: true,
  });
}
