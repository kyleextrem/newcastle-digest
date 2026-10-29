export function logShopDatabaseError(scope: string, error: unknown): void {
  const record = error && typeof error === 'object' ? (error as Record<string, unknown>) : null;
  console.error(scope, {
    name: clipLog(record?.name, 80),
    code: clipLog(record?.code, 40),
    constraint: clipLog(record?.constraint, 80),
    table: clipLog(record?.table, 80),
    column: clipLog(record?.column, 80),
    message: clipLog(record?.message, 300) ?? String(error).slice(0, 300),
  });
}

function clipLog(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string' || !value) {
    return undefined;
  }
  return value.slice(0, max);
}
