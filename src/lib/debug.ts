const PREFIX = '[CHARIS]'

/** Dev-only diagnostic logs — filter console by "CHARIS" */
export function debugLog(
  scope: string,
  message: string,
  data?: Record<string, unknown> | unknown,
) {
  if (data !== undefined) {
    console.log(`${PREFIX} ${scope}:`, message, data)
  } else {
    console.log(`${PREFIX} ${scope}:`, message)
  }
}

export function debugWarn(
  scope: string,
  message: string,
  data?: Record<string, unknown> | unknown,
) {
  if (data !== undefined) {
    console.warn(`${PREFIX} ${scope}:`, message, data)
  } else {
    console.warn(`${PREFIX} ${scope}:`, message)
  }
}

export function debugError(
  scope: string,
  message: string,
  error?: unknown,
) {
  console.error(`${PREFIX} ${scope}:`, message, error)
}
