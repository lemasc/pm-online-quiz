type LogOperation = {
  EXAM: "LIST" | "START" | "RESTORE" | "SUBMIT";
  EXAMDATA: "GET_ITEM" | "GET_CONTENT";
  CERT: "PRINT";
};

export function log<T extends keyof LogOperation>(
  operation: T,
  type: LogOperation[T],
  studentId?: number,
  data?: any
) {}
