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
// import { Observable } from 'rxjs'
import { Fish, FishId, Pond, Tag } from '@actyx/pond'
import { take } from 'rxjs/operators'
import { FishName, fromEventTypes, RegisterableFish } from './index'

// const nextStateAsPromise = <S>(pond: Pond, fish: Fish<S, any>) => new Promise((resolve, _reject) => pond.observe(fish, resolve))

export type State = { type: 'undefined' | 'set' | 'deleted'; fishName: FishName }
export type Event = { type: 'set' | 'delete'; fishName: FishName }

type EType = Event['type']

const TestTag = Tag<Event>('test')
const mkTestFish = (name: FishName): Fish<State, Event> => ({
  initialState: { type: 'undefined', fishName: name },

  onEvent: (state, event) => {
    switch (event.type) {
      case 'set':
        return { type: 'set', fishName: name }
      case 'delete':
        return { type: 'deleted', fishName: name }
      default:
        return state
    }
  },

  where: TestTag.withId(name),

  fishId: FishId.of('test', name, 0),
})

const TestFish: RegisterableFish<FishName, State, Event> = {
  descriptor: 'test',

  makeFish: mkTestFish,

  extractFishName: (e: Event) => e.fishName,

  events: TestTag,
}

const emitEvent = (pond: Pond, e: Event) =>
  pond.emit<Event>(TestTag.withId(TestFish.extractFishName(e)), e)

describe('registry from event types', () => {
  const TestCtrl = (pond: Pond) => {
    const setFish = (fishName: FishName) => emitEvent(pond, { type: 'set', fishName })
    const deleteFish = (fishName: FishName) => emitEvent(pond, { type: 'delete', fishName })

    const obsAll = (
      addWhen: EType | ReadonlyArray<EType>,
      removeWhen: EType | ReadonlyArray<EType> = [],
    ) =>
      fromEventTypes
        .observeAll(pond, TestFish, addWhen, removeWhen)
        .pipe(take(1))
        .toPromise()

    return { setFish, deleteFish, obsAll }
  }

  it('should aggregate known fish for 1 event type', async () => {
    const pond = await Pond.test()

    const T = TestCtrl(pond)
    T.setFish('foo')
    T.deleteFish('bar') // Ignored because we only look at 'set'

    return expect(T.obsAll('set')).resolves.toEqual([{ fishName: 'foo', type: 'set' }])
  })

  it('should aggregate known fish for multiple event types', async () => {
    const pond = await Pond.test()

    const T = TestCtrl(pond)
    T.setFish('foo')
    T.deleteFish('bar')

    return expect(T.obsAll(['set', 'delete'])).resolves.toEqual([
      { fishName: 'foo', type: 'set' },
      { fishName: 'bar', type: 'deleted' },
    ])
  })

  it('should forget about fish', async () => {
    const pond = await Pond.test()

    const T = TestCtrl(pond)
    T.setFish('foo')
    T.setFish('bar')
    T.deleteFish('foo')

    return expect(T.obsAll('set', 'delete')).resolves.toEqual([{ fishName: 'bar', type: 'set' }])
  })
})
