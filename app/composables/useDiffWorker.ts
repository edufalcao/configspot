import { rawDiff } from '~/utils/diff/raw';
import type { DiffOptions } from '~/utils/diff/raw';

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(
      new URL('../workers/diff.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return worker;
}

export interface DiffWorkerRequest {
  id: number,
  left: string,
  right: string,
  options?: DiffOptions
}

export interface DiffWorkerResponse {
  id: number,
  result?: string,
  error?: string
}

let requestId = 0;

export function useDiffWorker() {
  const result = ref<string | null>(null);
  const isComputing = ref(false);
  const error = ref<string | null>(null);

  function compute(
    left: string,
    right: string,
    options?: DiffOptions
  ): Promise<string> {
    const id = ++requestId;
    isComputing.value = true;
    error.value = null;
    result.value = null;

    return new Promise<string>((resolve, reject) => {
      let w: Worker;
      try {
        w = getWorker();
      } catch {
        // Worker unavailable — fall back to synchronous computation
        isComputing.value = false;
        try {
          const syncResult = rawDiff(left, right, options);
          result.value = syncResult;
          resolve(syncResult);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          error.value = msg;
          reject(new Error(msg));
        }
        return;
      }

      function onMessage(e: MessageEvent<DiffWorkerResponse>) {
        if (e.data.id !== id) return;
        cleanup();
        isComputing.value = false;
        if (e.data.error) {
          error.value = e.data.error;
          reject(new Error(e.data.error));
        } else if (e.data.result !== undefined) {
          result.value = e.data.result;
          resolve(e.data.result);
        }
      }

      function onError(e: ErrorEvent) {
        cleanup();
        isComputing.value = false;
        const msg = e.message ?? 'Worker error';
        error.value = msg;
        // Fall back to synchronous
        try {
          const syncResult = rawDiff(left, right, options);
          result.value = syncResult;
          resolve(syncResult);
        } catch {
          reject(new Error(msg));
        }
      }

      function cleanup() {
        w.removeEventListener('message', onMessage);
        w.removeEventListener('error', onError);
      }

      w.addEventListener('message', onMessage);
      w.addEventListener('error', onError);
      w.postMessage({ id, left, right, options } satisfies DiffWorkerRequest);
    });
  }

  return { result, isComputing, error, compute };
}
