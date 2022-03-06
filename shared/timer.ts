import axios, { AxiosRequestConfig } from "axios";
import create from "zustand";

export type TimedExamState = {
  startRequest?: number;
  timeUp: boolean;
  lastConnect: Date;
  timePending: number;
  nextCheck?: NodeJS.Timeout;
  latency?: number;
};

interface TimedExamStore {
  _state: Map<string, TimedExamState>;
  get: (id: string) => TimedExamState | undefined;
  set: (
    id: string,
    setFn: (state: TimedExamState | undefined) => Partial<TimedExamState>
  ) => void;
  clearTimer: (id: string) => void;
  destroy: (id: string) => void;
}

export const timerStore = create<TimedExamStore>((set, get) => ({
  _state: new Map(),
  get: (id) => get()._state.get(id),
  set: (id, setFn) => {
    set((state) => ({
      _state: state._state.set(
        id,
        setFn(state._state.get(id)) as TimedExamState
      ),
    }));
  },
  clearTimer: (id) => {
    const state = get()._state.get(id);
    if (state?.nextCheck) clearTimeout(state?.nextCheck);
  },
  destroy: (id: string) => {
    get()._state.delete(id);
  },
}));

const remoteExam = axios.create();

const checkTimeout = (id: string) =>
  setTimeout(() => {
    (async () => {
      try {
        await remoteExam.get(`/api/exam/${id}/time`);
      } catch {}
    })();
  }, 5 * 60 * 1000);

const getExamId = (config: AxiosRequestConfig): string =>
  config.url?.split("/")[3] as string;

export type RemoteExamError = {
  isRecoverable: boolean;
  isTimeEnd?: boolean;
  code: number;
};

remoteExam.interceptors.request.use((config) => {
  const examId = getExamId(config);
  const store = timerStore.getState();
  if (store.get(examId)) {
    store.set(examId, (state) => ({
      ...state,
      startRequest: new Date().valueOf(),
    }));
  }
  return config;
});

const processError = (error: any): RemoteExamError => {
  const lastConnect = new Date();
  if (axios.isAxiosError(error)) {
    if (!error.response) return { isRecoverable: true, code: 0 };
    else {
      if (error.response?.status === 402) {
        const examId = getExamId(error.response.config);
        const store = timerStore.getState();
        store.clearTimer(examId);
        store.set(examId, () => {
          return {
            timeUp: true,
            lastConnect,
            timePending: 0,
          };
        });
      }
      return {
        isRecoverable: true,
        isTimeEnd: error.response.status === 402,
        code: error.response.status,
      };
    }
  }
  return { isRecoverable: false, code: -1 };
};

remoteExam.interceptors.response.use(
  (response) => {
    const lastConnect = new Date();
    const examTime = response.headers["x-exam-time"];
    if (examTime) {
      const examId = getExamId(response.config);
      // The current exam session requires timing.
      const store = timerStore.getState();
      store.clearTimer(examId);
      store.set(examId, (state) => {
        let timePending = parseInt(examTime);
        if (state?.startRequest) {
          // Add latency between network requests, divided by 2 (duplex)
          const latency = (lastConnect.valueOf() - state.startRequest) / 2;
          timePending = timePending + latency;
        }
        return {
          timeUp: false,
          lastConnect,
          timePending,
          nextCheck: checkTimeout(examId),
        };
      });
    }
    return response;
  },
  (error) => {
    return Promise.reject(processError(error));
  }
);

export { remoteExam };
