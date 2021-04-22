/*
 * Copyright 2020 Actyx AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { RxPond } from '@actyx-contrib/rx-pond'
import { CancelSubscription, Fish, Pond } from '@actyx/pond'
import { combineLatest, Observable, of } from 'rxjs'
import { distinctUntilChanged, map, switchMap } from 'rxjs/operators'
import deepEqual from 'deep-equal'

/**
 * Use your complex registry fish to get the state of the referenced entities.
 *
 * @typeParam RegS       - Type of the observed registry Fish’s state.
 * @typeParam P          - Type of the properties used to initialize Fish.
 * @typeParam S          - Type of the observed Fish’s state.
 *
 * @param registryFish   - A `Fish<any, RegS>` to observe to get a list of the entities to observe
 * @param mapToProperty  - Map the state of the registry fish to an array of entity fish properties.
 * @param makeEntityFish - Factory function to create a Fish with state `S` from an property of type `P`.
 *                         `undefined` may be returned to indicate the given value should not be converted to a Fish at all.
 * @param onStateChanged - Function that will be called with the array of states whenever the set of Fish
 *                         changes or any of the contained Fish’s state changes.
 *
 * @returns              A function that can be called in order to cancel the subscription
 */
export const observeRegistry = <RegS, P, S>(
  pond: Pond,
  registryFish: Fish<RegS, any>,
  mapToProperty: (regState: RegS) => ReadonlyArray<P | undefined>,
  makeEntityFish: (prop: P) => Fish<S, any>,
  onStateChanged: (states: S[]) => void,
): CancelSubscription => {
  return observeRegistry$(
    RxPond.from(pond),
    registryFish,
    mapToProperty,
    makeEntityFish,
  ).subscribe({ next: (states): void => onStateChanged(states) }).unsubscribe
}

/**
 * Use your registry fish to get the state of the referenced entities.
 *
 * @typeParam RegS       - Type of the observed registry Fish’s state.
 * @typeParam P          - Type of the properties used to initialize Fish.
 * @typeParam S          - Type of the observed Fish’s state.
 *
 * @param registryFish   - A `Fish<any, RegS>` to observe to get a list of the entities to observe
 * @param mapToProperty  - Map the state of the registry fish to an array of entity fish properties.
 * @param makeEntityFish - Factory function to create a Fish with state `S` from an property of type `P`.
 *                         `undefined` may be returned to indicate the given value should not be converted to a Fish at all.
 *
 * @returns              An Observable of the last updated state of each entity fish.
 *                       Each published state will be stricter newer than the last one.
 *                       (the last array of states is buffered and immediately supplied to new subscribers.)
 */
export const observeRegistry$ = <RegS, RegE, Prop, State, Event>(
  rxPond: RxPond,
  registryFish: Fish<RegS, RegE>,
  mapToProperty: (regState: RegS) => ReadonlyArray<Prop | undefined>,
  makeEntityFish: (p: Prop) => Fish<State, Event>,
): Observable<State[]> =>
  rxPond.observe(registryFish).pipe(
    // just emit when the registry changed
    distinctUntilChanged(deepEqual),
    // get the ids to simplify the next steps
    map(mapToProperty),
    // filter out unset properties to protect fish from bad names
    map((props): Prop[] => props.filter((p): p is Prop => p !== undefined)),
    // switch over to the entity fish
    switchMap(
      (ids): Observable<State[]> =>
        ids.length === 0
          ? // return empty array when registry is empty
            of([])
          : // merge all new fish together to get them nicely into the observable structure
            combineLatest(
              // map the ID of the array to a ProductionOrderFish.of
              ids.map(id =>
                // observe a fish for each entry in the ids array
                rxPond.observe(makeEntityFish(id)),
              ),
            ),
    ),
  )
