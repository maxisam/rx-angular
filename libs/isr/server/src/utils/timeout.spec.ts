import { executeWithTimeout } from './timeout';

describe('executeWithTimeout', () => {
  it('should resolve the promise before the timeout', async () => {
    const result = await executeWithTimeout(
      Promise.resolve('success'),
      1000,
      'Timeout error',
    );
    expect(result).toBe('success');
  });

  it('should reject with a timeout error if the promise takes too long', async () => {
    await expect(
      executeWithTimeout(
        new Promise((resolve) => setTimeout(resolve, 2000)),
        1000,
        'Timeout error',
      ),
    ).rejects.toThrow('Timeout error');
  });

  it('should clear the timeout after the promise resolves', async () => {
    jest.useFakeTimers();
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const promise = new Promise((resolve) =>
      setTimeout(() => resolve('success'), 500),
    );
    const resultPromise = executeWithTimeout(promise, 1000, 'Timeout error');

    jest.advanceTimersByTime(500);
    const result = await resultPromise;
    expect(result).toBe('success');
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
    jest.useRealTimers();
  });
});
