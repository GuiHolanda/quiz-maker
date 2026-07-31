export function hasMessages(messages?: Record<string, string>): boolean {
  return !!messages && Object.keys(messages).length > 0;
}
