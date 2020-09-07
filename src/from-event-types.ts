import { Fish, FishId, Where } from '@actyx/pond'
import { Observable } from 'rxjs'
import { observeRegistry } from './observe'
import { ExtractFishName, isArray, PondLike, RegisterableFish, RegistryFishState } from './types'

const mkOnEvent = <E extends { type: string }>(
  extractFishName: ExtractFishName<E, string>,
  addEvents: ReadonlyArray<E['type']>,
  removeEvents: ReadonlyArray<E['type']>,
) => (state: RegistryFishState, payload: E) => {
  const fishName = extractFishName(payload)

  if (fishName === undefined) {
    return state
  }

  if (addEvents.includes(payload.type)) {
    state[fishName] = true
  } else if (removeEvents.includes(payload.type)) {
    delete state[fishName]
  }

  return state
}

/**
 * Create a RegistryFish based on selections of event types that add or remove Fish from the Registry.
 *
 * ## example
 * ```typescript
 * enum EventType {
 *     create = 'create',
 *     delete = 'delete',
 * }
 * type Event = { type: EventType, entityId: string }
 * const Events = Tag<Event>('example-tag')
 *
 * const RegistryFish1 = createRegistryFish(Events, (e: Event) => e.entityId, EventType.create)
 * const RegistryFish2 = createRegistryFish(Events, (e: Event) => e.entityId, EventType.create, EventType.deleted)
 * const RegistryFish3 = createRegistryFish(Events, (e: Event) => e.entityId, [EventType.create])
 * const RegistryFish4 = createRegistryFish(Events, (e: Event) => e.entityId, [EventType.create], [EventType.deleted])
 * ```
 *
 * @param events             Event stream to base the registry on
 * @param extractFishName    How to get the related Fish’s name from an event.
 * @param addWhen            Event type or list of event types that cause a Fish to be added to the Registry.
 * @param removeWhen         Event type or list of event types that cause a Fish to be removed from the Registry.
 * @param discriminant       If you are creating multiple registries, where ONLY `extractFishName` differs,
 *                           you must pass a different `discriminant`, in order to avoid caching conflicts.
 */
export const createRegistryFish = <E extends { type: string }>(
  events: Where<E>,
  extractFishName: ExtractFishName<E, string>,
  addWhen: E['type'] | ReadonlyArray<E['type']>,
  removeWhen: E['type'] | ReadonlyArray<E['type']> = [],
  discriminant?: string,
): Fish<RegistryFishState, E> => {
  const addEvents = isArray(addWhen) ? addWhen : [addWhen]
  const removeEvents = isArray(removeWhen) ? removeWhen : [removeWhen]

  const onEvent = mkOnEvent(extractFishName, addEvents, removeEvents)
  const fish: Fish<RegistryFishState, E> = {
    where: events,

    initialState: {},

    fishId: FishId.of(
      'fish-registry',
      // Event selection plus grouping into add/remove [almost] completely define this Fish.
      // Only if somehow the user supplies different extractFishName functions, there will be a problem.
      events.toString() + addEvents.toString() + removeEvents.toString() + discriminant,
      0,
    ),

    onEvent,
  }

  return fish
}

/**
 * Observe all Fish of a given type, according to selections of event types that cause a Fish to be added or removed.
 *
 * ## example
 * ```typescript
 * const AllExampleFish1$ = observeAll(pond, ExampleFish, EventType.create)
 * const AllExampleFish2$ = observeAll(pond, ExampleFish, EventType.create, EventType.deleted)
 * const AllExampleFish3$ = observeAll(pond, ExampleFish, [EventType.create])
 * const AllExampleFish4$ = observeAll(pond, ExampleFish, [EventType.create], [EventType.deleted])
 * ```
 *
 * @param pond               Reference to the Pond or its `observe` function.
 * @param entityFish         A general description of the Fish we register.
 *                           Tip: You can just pass a `FishType` instance from the actyx-contrib/fish-type-v2 package!
 * @param addWhen            Event type or list of event types that cause a Fish to be added to the Registry.
 * @param removeWhen         Event type or list of event types that cause a Fish to be removed from the Registry.
 */
export const observeAll = <S, E extends { type: string }>(
  pond: PondLike,
  entityFish: RegisterableFish<string, S, E>,
  addWhen: E['type'] | ReadonlyArray<E['type']>,
  removeWhen: E['type'] | ReadonlyArray<E['type']> = [],
): Observable<ReadonlyArray<S>> => {
  const registryFish = createRegistryFish(
    entityFish.events,
    entityFish.extractFishName,
    addWhen,
    removeWhen,
    entityFish.descriptor,
  )
  return observeRegistry<S>(pond, registryFish, entityFish.makeFish)
}
