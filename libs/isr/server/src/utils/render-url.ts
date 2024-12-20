import { APP_BASE_HREF } from '@angular/common';
import { Provider, StaticProvider } from '@angular/core';
import { ɵSERVER_CONTEXT as SERVER_CONTEXT } from '@angular/platform-server';
import { CommonEngine, CommonEngineRenderOptions } from '@angular/ssr';
import { ILogger } from '@rx-angular/isr/models';
import { Request, Response } from 'express';
import { DEFAULT_RENDERING_TIMEOUT } from './constants';
import { executeWithTimeout } from './timeout';

export interface RenderUrlConfig {
  req: Request;
  res: Response;
  url: string;
  indexHtml: string;
  providers?: Provider[];
  commonEngine?: CommonEngine;
  bootstrap?: CommonEngineRenderOptions['bootstrap'];
  browserDistFolder?: string;
  inlineCriticalCss?: boolean;
  logger?: ILogger;
  timeoutMs?: number; // Added a timeout configuration parameter
}

const EXTRA_PROVIDERS: Provider[] = [
  { provide: SERVER_CONTEXT, useValue: 'isr' },
];

// helper method that generates html of an url
export const renderUrl = async (options: RenderUrlConfig): Promise<string> => {
  const {
    req,
    res,
    url,
    indexHtml,
    providers,
    commonEngine,
    bootstrap,
    browserDistFolder,
    inlineCriticalCss,
    logger,
    timeoutMs = DEFAULT_RENDERING_TIMEOUT, // default timeout is 10 seconds
  } = options;

  req.url = url;
  req.originalUrl = url;

  const { protocol, originalUrl, baseUrl, headers } = req;
  const BASE_URL_PROVIDER: Provider = {
    provide: APP_BASE_HREF,
    useValue: baseUrl,
  };

  return new Promise((resolve, reject) => {
    const allProviders = providers
      ? [...providers, ...EXTRA_PROVIDERS] // if providers are provided, we add them to the list
      : [...EXTRA_PROVIDERS, BASE_URL_PROVIDER]; // if not, we add the default providers

    if (commonEngine) {
      logger?.debug(
        `Rendering url: ${protocol}://${headers.host}${originalUrl} with common engine from ${indexHtml}`,
      );

      // Rendering promise
      const renderPromise = commonEngine.render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: browserDistFolder,
        inlineCriticalCss: inlineCriticalCss ?? true,
        providers: [...allProviders] as StaticProvider[], // we need to cast to StaticProvider[] because of a bug in the types
      });

      // handle timeout manually until this issue is solved https://github.com/angular/angular/issues/51549
      executeWithTimeout(
        renderPromise,
        timeoutMs,
        `Rendering timeout after ${timeoutMs} ms`,
      )
        .then((html) => {
          logger?.debug(
            `done rendering url with common engine: ${html.substring(0, 200)}...`,
          );
          resolve(html);
        })
        .catch((err) => {
          logger?.error('Error: rendering url with common engine', err);
          reject(err);
        });
    } else {
      logger?.debug('Rendering url with express');
      res.render(
        indexHtml,
        { req, providers: allProviders },
        (err: Error, html: string) => {
          if (err) {
            logger?.error('Error: rendering url with express', err);
            reject(err);
          } else {
            logger?.debug(
              `done rendering url with express: ${html.substring(0, 200)}...`,
            );
            resolve(html);
          }
        },
      );
    }
  });
};
