export async function executeWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, rejectTimeout) => {
    timeoutId = setTimeout(() => {
      rejectTimeout(new Error(message));
    }, timeoutMs);
  });
  try {
    return (await Promise.race([promise, timeoutPromise])) as T;
  } finally {
    timeoutId && clearTimeout(timeoutId); // Clear the timeout once the operation is done or fails
  }
}
