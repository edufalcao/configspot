import { rawDiff } from '~/utils/diff/raw';
import type { DiffOptions } from '~/utils/diff/raw';

export interface WorkerRequest {
  id: number,
  left: string,
  right: string,
  options?: DiffOptions
}

export interface WorkerResponse {
  id: number,
  result?: string,
  error?: string
}

addEventListener('message', (e: MessageEvent<WorkerRequest>) => {
  const { id, left, right, options } = e.data;
  try {
    const result = rawDiff(left, right, options ?? {});
    postMessage({ id, result } satisfies WorkerResponse);
  } catch (error) {
    postMessage({ id, error: String(error) } satisfies WorkerResponse);
  }
});
