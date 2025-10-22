export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
};

export type ApiError = {
  detail: string; // backend returns { detail: "..." }
};
