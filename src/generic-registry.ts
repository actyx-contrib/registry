import { Fish, FishId, Where } from '@actyx/pond'
import { Observable } from 'rxjs'
import {
  ExtractFishName,
  PondLike,
  RegisterableFish,
  RegistryFishState,
  RegistryOnEvent,
} from './types'
import { observeRegistry } from './observe'

const mkOnEvent = <E>(extractFishName: ExtractFishName<E, string>, handler: RegistryOnEvent<E>) => (
  state: RegistryFishState,
  payload: E,
) => {
  const action = handler(payload)
  if (action === 'ignore') {
    return state
  }

  const fishName = extractFishName(payload)

  // Empty string should be okay
  if (fishName === undefined) {
    return state
  }

  if (action === 'add') {
    state[fishName] = true
  } else if (action === 'remove') {
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
 *     somethingElse = 'somethingElse',
 * }
 * type Event = { type: EventType, entityId: string }
 * const Events = Tag<Event>('example-tag')
 *
 * const handler = (e: Event) => {
 *     switch (e.type) {
 *         case 'create': return 'add'
 *         case 'delete': return 'remove'
 *         default: return 'ignore'
 *     }
 * }
 * const RegistryFish = createRegistryFish('my-registry', Events, (e: Event) => e.entityId, handler)
 * ```
 *
 * @param uniqueDescriptor   Give your registry a name. Used for caching!
 * @param events             Event stream to base the registry on.
 * @param extractFishName    How to get the related Fish’s name from an event.
 * @param handler            A function that decides whether a given event leads to addition or removal of its related entity.
 */
export const createRegistryFish = <E>(
  uniqueDescriptor: string,
  events: Where<E>,
  extractFishName: ExtractFishName<E, string>,
  handler: RegistryOnEvent<E> = () => 'add',
): Fish<RegistryFishState, E> => {
  const onEvent = mkOnEvent(extractFishName, handler)

  const fish: Fish<RegistryFishState, E> = {
    where: events,

    initialState: {},

    fishId: FishId.of('fish-registry', uniqueDescriptor + '_' + events.toString(), 0),

    onEvent,
  }

  return fish
}

/**
 * Observe all Fish of a given type, according to selections of event types that cause a Fish to be added or removed.
 *
 * ## example
 * ```typescript
 * const AllExampleFish$ = observeAllGeneric(pond, ExampleFish)
 * ```
 *
 * @param pond               Reference to the Pond or its `observe` function.
 * @param entityFish         A general description of the Fish we register.
 *                           Tip: You can just pass a `FishType` instance from the actyx-contrib/fish-type-v2 package!
 * @param handler            A function that decides whether a given event leads to addition or removal of its related entity.
 *                           By default it adds Fish on every event, and never removes Fish.
 */
export const observeAllGeneric = <S, E>(
  pond: PondLike,
  entityFish: RegisterableFish<string, S, E>,
  handler: RegistryOnEvent<E> = () => 'add',
): Observable<ReadonlyArray<S>> => {
  const registryFish = createRegistryFish(
    entityFish.descriptor,
    entityFish.events,
    entityFish.extractFishName,
    handler,
  )
  return observeRegistry(pond, registryFish, entityFish.makeFish)
}
