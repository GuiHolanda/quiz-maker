/* eslint-disable no-console */
export type LogFields = Readonly<Record<string, unknown>>;

type LogLevel = 'info' | 'warn' | 'error';

const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_FRAMES = 4;

const writeByLevel: Record<LogLevel, (line: string) => void> = {
  info: (line) => console.info(line),
  warn: (line) => console.warn(line),
  error: (line) => console.error(line),
};

function truncate(text: string): string {
  return text.length > MAX_MESSAGE_LENGTH ? `${text.slice(0, MAX_MESSAGE_LENGTH)}…` : text;
}

function topStackFrames(err: Error): string {
  return (err.stack ?? '')
    .split('\n')
    .filter((line) => line.trimStart().startsWith('at '))
    .slice(0, MAX_STACK_FRAMES)
    .join('\n');
}

export function serializeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) return { errorMessage: truncate(String(err)) };

  const { code, status, requestID } = err as Error & { code?: unknown; status?: unknown; requestID?: unknown };
  const stack = topStackFrames(err);

  return {
    errorName: err.name,
    errorMessage: truncate(err.message),
    ...(code !== undefined && { errorCode: code }),
    ...(status !== undefined && { errorStatus: status }),
    ...(requestID !== undefined && { errorRequestId: requestID }),
    ...(stack && { errorStack: stack }),
  };
}

function emit(level: LogLevel, event: string, fields: LogFields = {}): void {
  let line: string;

  try {
    line = JSON.stringify({ level, event, ...fields });
  } catch {
    line = JSON.stringify({ level, event, logError: 'fields could not be serialized' });
  }

  writeByLevel[level](line);
}

export const logger = {
  info: (event: string, fields?: LogFields): void => emit('info', event, fields),
  warn: (event: string, fields?: LogFields): void => emit('warn', event, fields),
  error: (event: string, fields?: LogFields): void => emit('error', event, fields),
};
