import { Provider } from '@angular/core';
import {
  CacheHandler,
  CacheKeyGeneratorFn,
  ILogger,
  ISRHandlerConfig,
  RenderVariant,
} from '@rx-angular/isr/models';
import { Request, Response } from 'express';
import { defaultModifyGeneratedHtml } from './modify-generated-html';
import { defaultCacheKeyGenerator, getVariant } from './utils/cache-utils';
import { DEFAULT_CACHE_TIMEOUT } from './utils/constants';
import { getRouteISRDataFromHTML } from './utils/get-isr-options';
import { renderUrl, RenderUrlConfig } from './utils/render-url';
import { executeWithTimeout } from './utils/timeout';

export interface IGeneratedResult {
  html?: string | Buffer;
  errors?: string[];
}

export class CacheGeneration {
  // TODO: make this pluggable because on serverless environments we can't share memory between functions
  // so we need to use a database or redis cache to store the urls that are on hold if we want to use this feature
  private urlsOnHold: string[] = []; // urls that have regeneration loading

  constructor(
    public isrConfig: ISRHandlerConfig,
    public cache: CacheHandler,
    public logger: ILogger,
  ) {
    if (!this.isrConfig.cacheKeyGenerator) {
      this.isrConfig.cacheKeyGenerator = defaultCacheKeyGenerator;
    }
  }
  getCacheKey: CacheKeyGeneratorFn = (
    url: string,
    allowedQueryParams: string[] | null | undefined,
    variant: RenderVariant | null,
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.isrConfig.cacheKeyGenerator!(url, allowedQueryParams, variant);
  };

  async generate(
    req: Request,
    res: Response,
    providers?: Provider[],
    mode: 'regenerate' | 'generate' = 'regenerate',
  ): Promise<IGeneratedResult | void> {
    const { url } = req;
    const variant = getVariant(req, this.isrConfig.variants);
    const cacheKey = this.getCacheKey(
      url,
      this.isrConfig.allowedQueryParams,
      variant,
    );

    return this.generateWithCacheKey(req, res, cacheKey, providers, mode);
  }
  async generateWithCacheKey(
    req: Request,
    res: Response,
    cacheKey: string,
    providers?: Provider[],
    mode: 'regenerate' | 'generate' = 'regenerate',
  ): Promise<IGeneratedResult | void> {
    const { url } = req;

    if (mode === 'regenerate') {
      // only regenerate will use queue to avoid multiple regenerations for the same url
      // generate mode is used for the request without cache
      if (this.urlsOnHold.includes(cacheKey)) {
        this.logger.info('Another generation is on-going for this url...');
        return;
      }
      this.logger.info(`The url: ${cacheKey} is being ${mode}.`);

      this.urlsOnHold.push(cacheKey);
    }
    const renderUrlConfig: RenderUrlConfig = {
      req,
      res,
      url,
      indexHtml: this.isrConfig.indexHtml,
      providers,
      commonEngine: this.isrConfig.commonEngine,
      bootstrap: this.isrConfig.bootstrap,
      browserDistFolder: this.isrConfig.browserDistFolder,
      inlineCriticalCss: this.isrConfig.inlineCriticalCss,
      logger: this.logger,
      timeoutMs: this.isrConfig.renderingTimeoutMs,
    };
    try {
      const html = await renderUrl(renderUrlConfig);
      const { revalidate: initialRevalidate, errors } =
        getRouteISRDataFromHTML(html);
      let revalidate = initialRevalidate;
      this.logger.debug(
        `Revalidate time for cacheKey: ${cacheKey}: ${revalidate}`,
      );

      // Apply the modify generation callback
      // If undefined, use the default modifyGeneratedHtml function
      let finalHtml: string | Buffer = this.isrConfig.modifyGeneratedHtml
        ? this.isrConfig.modifyGeneratedHtml(req, html, revalidate)
        : defaultModifyGeneratedHtml(req, html, revalidate);
      // Apply the compressHtml callback
      if (this.isrConfig.compressHtml) {
        this.logger.debug('Compressing HTML...');
        finalHtml = await this.isrConfig.compressHtml(finalHtml);
      }
      // if there are errors, don't add the page to cache
      if (errors?.length && this.isrConfig.skipCachingOnHttpError) {
        // remove url from urlsOnHold because we want to try to regenerate it again
        if (mode === 'regenerate') {
          this.urlsOnHold = this.urlsOnHold.filter((x) => x !== cacheKey);
        }
        this.logger.error(
          `💥 ERROR: Url: ${cacheKey} was not regenerated!`,
          errors,
        );
        return { html: finalHtml, errors };
      }

      // if revalidate is null / -1 / undefined we won't cache it
      // if revalidate is 0, we will never clear the cache automatically
      // if revalidate is x, we will clear cache every x seconds (after the last request) for that url
      revalidate = revalidate || this.isrConfig.defaultRevalidate;
      if (revalidate === -1) {
        this.logger.debug('Revalidate is -1, not caching...');
        return { html: finalHtml };
      }

      if (revalidate === null || revalidate === undefined) {
        // don't do !revalidate because it will also catch "0"
        this.logger.debug('Revalidate is null or undefined, not caching...');
        return { html: finalHtml };
      }

      // add the regenerated page to cache
      const addToCache = async () => {
        try {
          await executeWithTimeout(
            this.cache.add(cacheKey, finalHtml, {
              revalidate,
              buildId: this.isrConfig.buildId,
            }),
            this.isrConfig.cacheTimeoutMs || DEFAULT_CACHE_TIMEOUT, // Specify the timeout duration in milliseconds
            `Timeout while adding to cache for cacheKey: ${cacheKey}`,
          );
        } catch (error) {
          this.logger.warn(
            `Failed to add to cache for cacheKey: ${cacheKey}`,
            error,
          );
        }
      };

      try {
        if (this.isrConfig.nonBlockingRender) {
          this.logger.debug('Adding to cache without waiting...');
          // If enabled, add to cache without waiting (fire-and-forget)
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          addToCache();
        } else {
          this.logger.debug('Adding to cache...');
          // If not enabled, wait for cache addition to complete before proceeding
          await addToCache();
        }
      } catch (error) {
        this.logger.error('Error adding to cache', error);
      }

      if (mode === 'regenerate') {
        // remove from urlsOnHold because we are done
        this.urlsOnHold = this.urlsOnHold.filter((x) => x !== cacheKey);
        this.logger.info(`Url: ${cacheKey} was regenerated!`);
      }

      return { html: finalHtml };
    } catch (error) {
      this.logger.error(`Error ${mode} url: ${cacheKey}`, error);

      if (mode === 'regenerate') {
        // Ensure removal from urlsOnHold in case of error
        this.urlsOnHold = this.urlsOnHold.filter((x) => x !== cacheKey);
      }
      throw error;
    }
  }
}
