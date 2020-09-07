import { Fish, Pond, Where } from '@actyx/pond'
import { Observable } from 'rxjs'

/**
 * A Pond, or the `observe` function of a Pond.
 */
export type PondLike =
    | {
        observe: Pond['observe']
    }
    | Pond['observe']

type FishToObservable = <S, E>(fish: Fish<S, E>) => Observable<S>

/**
 * Convert a plain Pond.observe function (or Pond) into one that returns RX6 Observables.
 * @internal
 * @param pond pond or pond.observe
 */
export const extractObsFn = (pond: PondLike): Pond['observe'] => typeof pond === 'function' ? pond : pond.observe

/** 
 * Observe a Fish as RXjs Obs
 * @internal
 **/
export const obs = (pond: PondLike): FishToObservable => {
    const o = extractObsFn(pond)
    return <S, E>(fish: Fish<S, E>) =>
        new Observable<S>(subscriber => o(fish, s => subscriber.next(s)))
}

/** How to find a Fish’s "name" (to be remembered by the registry) from an event of type E. */
export type ExtractFishName<E, Id> = (event: E) => Id

/**
 * Registry Fish State:
 * Just an object that contains 'true' for every active Fish Name.
 * Use `Object.keys` to convert into an array.
 */
export type RegistryFishState = {
    [fishName: string]: boolean
}

/**
 * typed implementation of isArray
 * @internal
 * @param value value that could be an array
 */
export const isArray = <T>(value: T | ReadonlyArray<T>): value is ReadonlyArray<T> =>
    Array.isArray(value)

/**
 * OnEventHandler for a registry fish
 *
 * ## return:
 *
 * - `'add'` will add the event’s fish to the registry (only once)
 * - `'remove'` will remove the event’s fish registry
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

export type FishName = string

export type MakeFish<Id, S> = (fishName: Id) => Fish<S, any>

export type RegisterableFish<Id, S, E> = {
    /** Some unique descriptor for this group of Fish. It’s needed so different registries aren’t confused with one another. */
    descriptor: string

    /** Create a Fish instance from a FishName. */
    makeFish: MakeFish<Id, S>

    /** From an event, extract the name of the Fish it belongs to. */
    extractFishName: ExtractFishName<E, Id>

    /** Events to base the registration on */
    events: Where<E>
}
