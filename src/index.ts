import * as FromEventTypes from './from-event-types'
import * as Generic from './generic-registry'
import { observeRegistry } from './observe'

export const fromEventTypes = {
  create: FromEventTypes.createRegistryFish,
  observeAll: FromEventTypes.observeAll,
}

export const generic = {
  create: Generic.createRegistryFish,
  observeAll: Generic.observeAllGeneric,
}

export const observe = observeRegistry

export { observeRegistryMap } from './observe'
export * from './types'
