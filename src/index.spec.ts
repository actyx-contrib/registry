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
/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  obs,
  isArray,
  createRegistryFish,
  RegistryFishState,
  RegistryFishPublicState,
  observeRegistry,
  PondLike,
  observeRegistryMap,
  observeAll,
} from './index'
import { Observable } from 'rxjs'
import { FishType, OnStateChange, Semantics, Subscription, FishName, Envelope } from '@actyx/pond'
import { Lamport, SourceId, Timestamp, PondObservables, FishTypeImpl } from '@actyx/pond/lib/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mockObserve = <C, E, P>(_fish: FishType<C, E, P>, _name: string) => Observable.of<P>()

describe('registry', () => {
  describe('obs', () => {
    it('return the function', () => {
      expect(obs(mockObserve)).toBe(mockObserve)
    })
    it('return the function on pond like object', () => {
      const pondLike = { observe: mockObserve }
      expect(obs(pondLike)).toBe(mockObserve)
    })
  })

  describe('isArray', () => {
    it('check false', () => {
      expect(isArray(undefined)).toBeFalsy()
      expect(isArray(null)).toBeFalsy()
      expect(isArray(1)).toBeFalsy()
      expect(isArray('false')).toBeFalsy()
      expect(isArray(false)).toBeFalsy()
      expect(isArray({})).toBeFalsy()
    })
    it('check false', () => {
      expect(isArray([])).toBeTruthy()
      expect(isArray([1])).toBeTruthy()
      expect(isArray([])).toBeTruthy()
      expect(isArray(['test'])).toBeTruthy()
      expect(isArray([undefined])).toBeTruthy()
      expect(isArray([{}, {}])).toBeTruthy()
    })
  })

  describe('observeRegistry', () => {
    it('observe empty reg', async () => {
      const reg = createRegistryFish(TestFish, 'set')
      const obsMock = jest
        .fn(mockObserve)
        .mockReturnValueOnce(Observable.of([] as RegistryFishPublicState))
        // ignored. no fish in registry
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))

      const out = observeRegistry(obsMock as PondLike, reg, TestFish)

      const states = await out.take(1).toPromise()
      expect(states).toStrictEqual([])
    })
    it('observe two fish in registry', async () => {
      const reg = createRegistryFish(TestFish, 'set')
      const obsMock = jest
        .fn(mockObserve)
        .mockReturnValueOnce(
          Observable.of([FishName.of('A'), FishName.of('B')] as RegistryFishPublicState),
        )
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))
        .mockReturnValueOnce(Observable.of({ type: 'deleted' } as State))
        // ignore third. two fish are in registry
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))

      const out = observeRegistry(obsMock as PondLike, reg, TestFish)

      const states = await out.take(1).toPromise()
      expect(states).toStrictEqual([{ type: 'set' }, { type: 'deleted' }])
      expect(obsMock).toHaveBeenNthCalledWith(1, reg, 'reg')
      expect(obsMock).toHaveBeenNthCalledWith(2, TestFish, 'A')
      expect(obsMock).toHaveBeenNthCalledWith(3, TestFish, 'B')
    })
  })

  describe('observeRegistry', () => {
    it('observe empty reg', async () => {
      const reg = createRegistryFish(TestFish, 'set')
      const obsMock = jest
        .fn(mockObserve)
        .mockReturnValueOnce(Observable.of([] as RegistryFishPublicState))
        // ignored. no fish in registry
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))

      const out = observeRegistryMap(obsMock as PondLike, reg, state => state, TestFish)

      const states = await out.take(1).toPromise()
      expect(states).toStrictEqual([])
    })
    it('observe two fish in registry', async () => {
      const reg = createRegistryFish(TestFish, 'set')
      const obsMock = jest
        .fn(mockObserve)
        .mockReturnValueOnce(
          Observable.of([FishName.of('A'), FishName.of('B')] as RegistryFishPublicState),
        )
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))

      const out = observeRegistryMap(
        obsMock as PondLike,
        reg,
        state => state.map(s => FishName.of(`${s}-map`)),
        TestFish,
      )

      const states = await out.take(1).toPromise()
      expect(states).toStrictEqual([{ type: 'set' }, { type: 'set' }])
      expect(obsMock).toHaveBeenNthCalledWith(1, reg, 'reg')
      expect(obsMock).toHaveBeenNthCalledWith(2, TestFish, 'A-map')
      expect(obsMock).toHaveBeenNthCalledWith(3, TestFish, 'B-map')
    })
  })
  describe('createRegistryFish', () => {
    it('create registry fish', () => {
      expect(createRegistryFish(TestFish, 'set')).toBeDefined()
      expect(createRegistryFish(TestFish, ['set'])).toBeDefined()
      expect(createRegistryFish(TestFish, _ev => 'add')).toBeDefined()
      expect(createRegistryFish(TestFish, _ev => 'remove')).toBeDefined()
      expect(createRegistryFish(TestFish, _ev => 'ignore')).toBeDefined()
      expect(createRegistryFish(TestFish, 'set', 'delete')).toBeDefined()
      expect(createRegistryFish(TestFish, 'set', ['delete'])).toBeDefined()
      expect(createRegistryFish(TestFish, ['set'], ['delete'])).toBeDefined()
    })

    it('check semantics', () => {
      expect(createRegistryFish(TestFish, 'set').semantics).toStrictEqual('testset')
      expect(createRegistryFish(TestFish, ['set'], ['delete']).semantics).toStrictEqual(
        'testsetdelete',
      )
      expect(createRegistryFish(TestFish, _ => 'add').semantics).toStrictEqual(
        "testfunction (_) { return 'add'; }",
      )
    })

    it('check init state', () => {
      const initState = createRegistryFish(TestFish, 'set').initialState(
        'something',
        SourceId.of('ABCDE'),
      )
      expect(initState.state).toStrictEqual({})
      expect(initState.subscriptions).toBeDefined()
      if (initState.subscriptions) {
        expect(initState.subscriptions).toHaveLength(1)
        expect(initState.subscriptions[0].semantics).toStrictEqual(TestFish.semantics)
        expect(initState.subscriptions[0].name).toStrictEqual('')
        expect(initState.subscriptions[0].sourceId).toStrictEqual('')
      }
    })

    it('publish state as array', async () => {
      const reg = createRegistryFish(TestFish, 'set')
      const faceObserve = <C, E, P>(_fish: FishType<C, E, P>, _name: string) =>
        Observable.never<P>()
      const faceObserveSelf = () => Observable.of<RegistryFishState>({ A: true, B: true, C: true })
      const facePondObs: PondObservables<RegistryFishState> = {
        observe: faceObserve,
        observeSelf: faceObserveSelf,
      }
      const out = await reg.onStateChange(facePondObs).toPromise()
      expect(out.type).toStrictEqual('publish')
      if (out.type === 'publish') {
        expect(out.state).toStrictEqual(['A', 'B', 'C'])
      }
    })

    it('check localSnapshot', () => {
      const reg = createRegistryFish(TestFish, 'set')
      const [, events] = createRandomEvents(1000)
      const newState = events.reduce((state, ev) => reg.onEvent(state, ev), {})

      expect(reg.localSnapshot).toBeDefined()
      if (reg.localSnapshot) {
        const serialize = JSON.stringify(reg.localSnapshot.serialize(newState))
        const deserialize = reg.localSnapshot.deserialize(JSON.parse(serialize))
        expect(deserialize).toStrictEqual(newState)
      }
    })

    it('add entity', () => {
      const reg = createRegistryFish(TestFish, 'set')
      const sources = getRandomSourceIds(1000)
      const events = sources.map(s => createEvent<Event>(s, { type: 'set' }))
      const names = registryStateFromSources(sources)

      expect(runFish(reg, events)).toStrictEqual(names)
    })

    it('add array entity', () => {
      const reg = createRegistryFish(TestFish, ['set', 'delete'])
      const [sources, events] = createRandomEvents(1000)

      const names = registryStateFromSources(sources)

      expect(runFish(reg, events)).toStrictEqual(names)
    })

    it('add and remove entity', () => {
      ;[
        createRegistryFish(TestFish, 'set', 'delete'),
        createRegistryFish(TestFish, ['set'], 'delete'),
        createRegistryFish(TestFish, 'set', ['delete']),
        createRegistryFish(TestFish, ['set'], ['delete']),
      ].forEach(reg => {
        const addSources = getRandomSourceIds(1000)
        const removeSources = getRandomSourceIds(1000)
        const addEvents = addSources.map(s => createEvent<Event>(s, { type: 'set' }))
        const removeEvents = removeSources.map(s => createEvent<Event>(s, { type: 'delete' }))
        const allEvents = [...addEvents, ...removeEvents]

        const addNames = addSources.reduce<Record<string, boolean>>(
          (acc, s) => ({ ...acc, [s]: true }),
          {},
        )
        const remainingNames = removeSources.reduce((acc, s) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [s]: _drop, ...out } = acc
          return out
        }, addNames)

        expect(runFish(reg, allEvents)).toStrictEqual(remainingNames)
      })
    })
    it('use Handler in onEvent / ignore', () => {
      const [, events] = createRandomEvents(1000)
      const regIgnore = createRegistryFish(TestFish, _ => 'ignore')
      const state = runFish(regIgnore, events)
      expect(state).toStrictEqual({})
    })
    it('use Handler in onEvent / add', () => {
      const [sources, events] = createRandomEvents(1000)
      const regAdd = createRegistryFish(TestFish, _ => 'add')
      const names = registryStateFromSources(sources)
      const addState = runFish(regAdd, events)
      expect(addState).toStrictEqual(names)
    })

    it('use Handler in onEvent / remove', () => {
      const [sources, events] = createRandomEvents(1000)
      const regAdd = createRegistryFish(TestFish, _ => 'remove')
      const names = registryStateFromSources(sources)
      expect(runFish(regAdd, events, names)).toStrictEqual({})
    })
  })
  describe('observeAll', () => {
    it('check if underlying functions are called', async () => {
      const obsMock = jest
        .fn(mockObserve)
        .mockReturnValueOnce(
          Observable.of([
            FishName.of('A'),
            FishName.of('B'),
            FishName.of('C'),
          ] as RegistryFishPublicState),
        )
        .mockReturnValueOnce(Observable.of({ type: 'deleted' } as State))
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))
        .mockReturnValueOnce(Observable.of({ type: 'set' } as State))

      const states = await observeAll(obsMock as PondLike, TestFish, 'set')
        .take(1)
        .toPromise()

      expect(states).toStrictEqual([{ type: 'deleted' }, { type: 'set' }, { type: 'set' }])
      expect(obsMock).toHaveBeenNthCalledWith(2, TestFish, 'A')
      expect(obsMock).toHaveBeenNthCalledWith(3, TestFish, 'B')
      expect(obsMock).toHaveBeenNthCalledWith(4, TestFish, 'C')
    })
    it('check if underlying functions are called', async () => {
      const obsMock = jest
        .fn(mockObserve)
        .mockReturnValueOnce(Observable.of([] as RegistryFishPublicState))

      const states = await observeAll(obsMock as PondLike, TestFish, 'set', 'delete')
        .take(1)
        .toPromise()

      expect(states).toStrictEqual([])
    })
  })
})

describe('test helper', () => {
  it('registryStateFromSources', () => {
    expect(registryStateFromSources(['A', 'A', 'B', 'C', 'c', '1'])).toStrictEqual({
      A: true,
      B: true,
      C: true,
      c: true,
      '1': true,
    })
  })

  it('createRandomEvents', () => {
    const [sources, events] = createRandomEvents(3)
    expect(sources).toHaveLength(3)
    expect(events).toHaveLength(3)

    expect(events.map(e => e.source.name)).toStrictEqual(sources)
  })

  it('createEvent', () => {
    const payload = ['A', 'B', 'C']
    const event = createEvent('Name', payload)
    expect(event.lamport).toStrictEqual(0)
    expect(event.timestamp).toStrictEqual(0)
    expect(event.source.name).toStrictEqual('Name')
    expect(event.payload).toStrictEqual(payload)
  })
})

type RegFish = FishTypeImpl<RegistryFishState, unknown, Event, RegistryFishPublicState>
const runFish = (
  fish: RegFish,
  events: Envelope<Event>[],
  initState: RegistryFishState = {},
): RegistryFishState => {
  let state = initState
  for (let i = 0; i < events.length; ++i) {
    state = fish.onEvent(state, events[i])
  }
  return state
}

const registryStateFromSources = (sources: string[]): RegistryFishState =>
  sources.reduce((acc, s) => ({ ...acc, [s]: true }), {})

const createRandomEvents = (count: number): [string[], Envelope<Event>[]] => {
  const sources = getRandomSourceIds(count)
  const events = sources.map(s =>
    createEvent<Event>(s, {
      type: Math.random() * 2 > 1 ? 'set' : 'delete',
    }),
  )
  return [sources, events]
}

const getRandomSourceIds = (count: number) =>
  Array(count)
    .fill(0)
    .map(_ => (Math.random() * 1000).toFixed(0))

const createEvent = <T>(name: string, payload: T): Envelope<T> => ({
  lamport: Lamport.of(0),
  source: {
    semantics: Semantics.of('test'),
    name: FishName.of(name),
    sourceId: SourceId.of('00000001'),
  },
  timestamp: Timestamp.of(0),
  payload,
})

export type State = { type: 'undefined' } | { type: 'set' } | { type: 'deleted' }
export type Event = { type: 'set' | 'delete' }

export const TestFish = FishType.of<State, unknown, Event, State>({
  semantics: Semantics.of('test'),
  initialState: name => ({
    state: { type: 'undefined' },
    subscriptions: [Subscription.of(Semantics.of('test'), name)],
  }),
  onEvent: (state, event) => {
    switch (event.payload.type) {
      case 'set':
        return { type: 'set' }
      case 'delete':
        return { type: 'deleted' }
      default:
        return state
    }
  },
  onStateChange: OnStateChange.publishPrivateState(),
})
