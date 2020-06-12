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
import { FishName, FishType, OnStateChange, Pond, Semantics, Subscription } from '@actyx/pond'
import { Observable } from 'rxjs'
import { combineLatest } from 'rxjs/observable/combineLatest'

/**
 * type to use the pondLike or the observe function it self
 */
export type PondLike =
  | {
      observe: Pond['observe']
    }
  | Pond['observe']

/**
 * helper to get the observe function from the parameter
 * @internal
 * @param pond pond or pond.observe
 */
const obs = (pond: PondLike): Pond['observe'] =>
  typeof pond === 'function' ? pond : pond.observe

/**
 * observeRegistry can be used to map the state of an registryFish to the entity fish
 *
 * @see observeRegistryMap map the registry fish state to a FishName[]
 *
 * @param pond pond instance or pond.observe function
 * @param registryFish registry fish which state is a FishName[]
 * @param entityFish entity fish to observe the state
 */
export const observeRegistry = <P>(
  pond: PondLike,
  registryFish: FishType<unknown, unknown, ReadonlyArray<FishName>>,
  entityFish: FishType<unknown, unknown, P>,
): Observable<ReadonlyArray<P>> =>
  obs(pond)(registryFish, FishName.of('reg')).switchMap(names =>
    names.length === 0
      ? Observable.never<ReadonlyArray<P>>().startWith([])
      : combineLatest(names.map(name => obs(pond)(entityFish, name))),
  )

/**
 * observeRegistryMap can be used to map the state of an registryFish to the entity fish
 *
 * The _Map_ version take an map function to map the PublicRegistryFishState to a FishName array
 *
 * @see observeRegistry if you don't have to map the state
 *
 * @param pond pond like instance or pond.observe function
 * @param registryFish registry fish that contains a array of `FishName`s to observe them
 * @param map map function that have to return a array on `FishName`s
 * @param entityFish entity fish to observe the state
 */
export const observeRegistryMap = <R, P>(
  pond: PondLike,
  registryFish: FishType<unknown, unknown, R>,
  map: (state: R) => ReadonlyArray<FishName>,
  entityFish: FishType<unknown, unknown, P>,
): Observable<ReadonlyArray<P>> =>
  obs(pond)(registryFish, FishName.of('reg'))
    .map(map)
    .switchMap(names =>
      names.length === 0
        ? Observable.never<ReadonlyArray<P>>().startWith([])
        : combineLatest(names.map(name => obs(pond)(entityFish, name))),
    )

/**
 * private and public state of the registry fish
 */
export type RegistryFishState = ReadonlyArray<FishName>

/**
 * OnEventHandler for a registry fish
 *
 * ## return:
 *
 * - `'add'` will add the event source.name to the registry (only once)
 * - `'remove'` will remove the event source.name to the registry
 * - `'ignore'` registry will not change
 *
 * ## example
 * ```typescript
 * const eventHandler: RegistryOnEvent<Event> = event => {
 *     switch (event.type) {
 *       case EventType.create:
 *         return 'add'
 *       case EventType.deleted:
 *         return 'remove'
 *       default:
 *         return 'ignore';
 *     }
 *   }
 * ```
 */
export type RegistryOnEvent<E> = (payload: E) => 'add' | 'remove' | 'ignore'

/**
 * Create a Registry fish for a given fish type
 *
 * ## example
 * ```typescript
 * const RegistryFish1 = createRegistryFish(ExampleFish, EventType.create)
 * const RegistryFish2 = createRegistryFish(ExampleFish, EventType.create, EventType.deleted)
 * const RegistryFish3 = createRegistryFish(ExampleFish, [EventType.create])
 * const RegistryFish4 = createRegistryFish(ExampleFish, [EventType.create], [EventType.deleted])
 * const RegistryFish5 = createRegistryFish(
 *   ExampleFish,
 *   event => {
 *     switch (event.type) {
 *       case EventType.create:
 *         return 'add'
 *       case EventType.deleted:
 *         return 'remove'
 *       default:
 *         return 'ignore';
 *     }
 *   }
 * )
 * ```
 *
 * @param entityFish Fish to create the registry for
 * @param addEventOrEventHandler EventType or array of EventTypes to add the source.name to the registry or an eventHandler for more complex registry use-cases
 * @param removeEvent EventType or array of EventTypes, when the source.name should be removed from the registry
 */
export const createRegistryFish = <E extends { type: string }>(
  entityFish: FishType<unknown, E, unknown>,
  addEventOrEventHandler: E['type'] | ReadonlyArray<E['type']> | RegistryOnEvent<E>,
  removeEvent: E['type'] | ReadonlyArray<E['type']> = [],
) => {
  return FishType.of<RegistryFishState, unknown, E, RegistryFishState>({
    semantics: Semantics.of(entityFish.semantics + addEventOrEventHandler.toString() + removeEvent.toString()),
    initialState: () => ({
      state: [],
      subscriptions: [Subscription.of(entityFish)],
    }),
    onEvent: (state, event) => {
      const { payload, source } = event
      if (typeof addEventOrEventHandler === 'function') {
        switch (addEventOrEventHandler(payload)) {
          case 'add':
            return state.some(name => name === source.name) ? state : [...state, source.name]
          case 'remove':
            return state.filter(name => name !== source.name)
          case 'ignore':
          default:
            return state
        }
      } else {
        const addEvents: ReadonlyArray<E['type']> = Array.isArray(addEventOrEventHandler)
          ? addEventOrEventHandler
          : [addEventOrEventHandler]
        const removeEvents: ReadonlyArray<E['type']> = Array.isArray(removeEvent)
          ? removeEvent
          : [removeEvent]

        if (addEvents.some(eventType => eventType === payload.type)) {
          return state.some(name => name === source.name) ? state : [...state, source.name]
        } else if (removeEvents.some(eventType => eventType === payload.type)) {
          return state.filter(name => name !== source.name)
        } else {
          return state
        }
      }
    },
    onStateChange: OnStateChange.publishPrivateState(),
    localSnapshot: {
      version: 1,
      serialize: state => state,
      deserialize: state => state as ReadonlyArray<FishName>,
    },
  })
}

/**
 * create an internal registry fish and return a stream of the state of all referenced entryFish as array
 *
 * ## Example
 *
 * ```typescript
 * const registryFish1 = observeAll(pond, ExampleFish, EventType.create)
 * const registryFish2 = observeAll(pond, ExampleFish, EventType.create, EventType.deleted)
 * const registryFish3 = observeAll(pond, ExampleFish, [EventType.create])
 * const registryFish4 = observeAll(pond, ExampleFish, [EventType.create], [EventType.deleted])
 * const registryFish5 = observeAll(
 *   pond,
 *   ExampleFish,
 *   event => {
 *     switch (event.type) {
 *       case EventType.create:
 *         return 'add'
 *       case EventType.deleted:
 *         return 'remove'
 *       default:
 *         return 'ignore';
 *     }
 *   }
 * )
 * ```
 *
 * @param pond pond instance or pond.observe function
 * @param entityFish entity to create registry fish and observe the state
 * @param addEventOrEventHandler EventType or array of EventTypes to add the source.name to the registry or an eventHandler for more complex registry use-cases
 * @param removeEvent EventType or array of EventTypes, when the source.name should be removed from the registry
 */
export const observeAll = <P, E extends { type: string }>(
  pond: PondLike,
  entityFish: FishType<unknown, E, P>,
  addEventOrEventHandler: E['type'] | ReadonlyArray<E['type']> | RegistryOnEvent<E>,
  removeEvent: E['type'] | ReadonlyArray<E['type']> = [],
): Observable<ReadonlyArray<P>> => {
  const registryFish = createRegistryFish(entityFish, addEventOrEventHandler, removeEvent)
  return observeRegistry(pond, registryFish, entityFish)
}
