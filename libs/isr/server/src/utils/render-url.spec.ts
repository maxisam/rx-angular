import { CommonEngine } from '@angular/ssr';
import { Request, Response } from 'express';
import { ILogger } from '../../../models/src/logger';
import { renderUrl, RenderUrlConfig } from './render-url';

jest.useFakeTimers();

describe('renderUrl - Timeout Test', () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockCommonEngine: CommonEngine;
  let mockLogger: ILogger;

  beforeEach(() => {
    mockRequest = {
      url: '',
      originalUrl: '',
      protocol: 'http',
      baseUrl: '',
      headers: { host: 'localhost' },
    } as unknown as Request;

    mockResponse = {} as Response;

    mockCommonEngine = {
      render: jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          // Simulate long rendering time
          setTimeout(() => {
            resolve('<html>Rendered Content</html>');
          }, 20000);
        });
      }),
    } as unknown as CommonEngine;

    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };
  });

  it('should reject with a timeout error if rendering takes too long', async () => {
    const RENDERING_TIMEOUT = 5000;
    const config: RenderUrlConfig = {
      req: mockRequest,
      res: mockResponse,
      url: '/test',
      indexHtml: 'index.html',
      commonEngine: mockCommonEngine,
      logger: mockLogger,
      timeoutMs: RENDERING_TIMEOUT, // Set timeout to 5 seconds
    };

    const renderPromise = renderUrl(config);

    // Fast-forward time
    jest.advanceTimersByTime(RENDERING_TIMEOUT);

    await expect(renderPromise).rejects.toThrow(
      `Rendering timeout after ${RENDERING_TIMEOUT} ms`,
    );
  });

  it('should resolve successfully if rendering completes within the timeout period', async () => {
    const RENDERING_TIME = 3000;
    mockCommonEngine.render = jest.fn().mockImplementation(() => {
      return new Promise((resolve) => {
        // Simulate rendering time within the timeout limit
        setTimeout(() => {
          resolve('<html>Rendered Content</html>');
        }, RENDERING_TIME);
      });
    });

    const config: RenderUrlConfig = {
      req: mockRequest,
      res: mockResponse,
      url: '/test',
      indexHtml: 'index.html',
      commonEngine: mockCommonEngine,
      logger: mockLogger,
      timeoutMs: 5000, // Set timeout to 5 seconds
    };

    const renderPromise = renderUrl(config);

    // Fast-forward time
    jest.advanceTimersByTime(RENDERING_TIME);

    await expect(renderPromise).resolves.toBe('<html>Rendered Content</html>');
  });
});
