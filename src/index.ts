import * as FromEventTypes from './from-event-types'
import * as Generic from './generic-registry'
import { observeRegistry } from './observe'

export const fromEventTypes = {
  create: FromEventTypes.createRegistryFish,
  observe: FromEventTypes.observeAll,
}

export const generic = {
  create: Generic.createRegistryFish,
  observe: Generic.observeAllGeneric,
}

export const observe = observeRegistry

export { observeRegistryMap } from './observe'
