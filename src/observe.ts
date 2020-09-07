import { Fish } from '@actyx/pond'
import { combineLatest, Observable, of } from 'rxjs'
import { map, switchMap } from 'rxjs/operators'
import { FishName, MakeFish, obs, PondLike, RegistryFishState } from './types'

const fishNamesToStates = <S>(pond: PondLike, makeFish: MakeFish<FishName, S>) => (
  fishNames: ReadonlyArray<FishName>,
) => {
  if (fishNames.length === 0) {
    return of<S[]>([])
  }

  const s: Observable<S>[] = fishNames.map(makeFish).map(obs(pond))

  return combineLatest(s)
}

/**
 * Retrieve all current states of Fish known to the given registry.
 *
 * @see observeRegistryMap for support of registries with states that are not `RegistryFishState`
 *
 * @param pond          Pond instance or pond.observe function reference.
 * @param registryFish  Fish with `RegistryFishState` as state
 * @param makeFish      Factory function for Fish from fishName
 */
export const observeRegistry = <S>(
  pond: PondLike,
  registryFish: Fish<RegistryFishState, any>,
  makeFish: MakeFish<FishName, S>,
): Observable<ReadonlyArray<S>> => {
  return observeRegistryMap(pond, registryFish, Object.keys, makeFish)
}

/**
 * Observe a registry with any sort of state, transformed into an Array of FishNames by the given mapFn.
 *
 * @see observeRegistry if you don't have to map the state
 *
 * @param pond          Pond instance or pond.observe function reference.
 * @param registryFish  Registry fish with any sort of state.
 * @param mapFN         Map function that converts the registry’s state into an array of `FishName`
 * @param makeFish      Factory function for Fish from fishName
 */
export const observeRegistryMap = <R, S>(
  pond: PondLike,
  registryFish: Fish<R, any>,
  mapFn: (state: R) => ReadonlyArray<FishName>,
  makeFish: MakeFish<string, S>,
): Observable<ReadonlyArray<S>> => {
  const names$ = map(mapFn)(obs(pond)(registryFish))

  return names$.pipe(switchMap(fishNamesToStates(pond, makeFish)))
}
