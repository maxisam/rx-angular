import { Observable } from 'rxjs';
import { distinctUntilChanged, map, startWith, tap } from 'rxjs/operators';
import {
  CdStrategy,
  DEFAULT_STRATEGY_NAME,
  StrategySelection
} from './strategy';

export function nameToStrategy<U>(strategies: StrategySelection<U>) {
  return (o$: Observable<string>): Observable<CdStrategy<U>> => {
    return o$.pipe(
      distinctUntilChanged(),
      map(
        (strategy: string): CdStrategy<U> =>
          strategies[strategy]
            ? strategies[strategy]
            : strategies[DEFAULT_STRATEGY_NAME]
      )
    );
  };
}