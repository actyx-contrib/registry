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
import { Fish, FishId, Tag } from '@actyx/pond'
import { Observable, of } from 'rxjs'

export type Event =
  | {
      eventType: 'add'
      id: string
    }
  | {
      eventType: 'remove'
      id: string
    }

export const registryFish: Fish<Record<string, boolean>, Event> = {
  fishId: FishId.of('reg', 'r', 0),
  initialState: {},
  where: Tag<Event>('all'),
  onEvent: (state, e) => {
    switch (e.eventType) {
      case 'add':
        state[e.id] = true
        break
      case 'remove':
        delete state[e.id]
        break
    }
    return state
  },
}
export type TestState = {
  id: string
  add: number
  remove: number
}
export const testFish = (id: string): Fish<TestState, Event> => ({
  fishId: FishId.of('testFisch', id, 0),
  initialState: { id, add: 0, remove: 0 },
  where: Tag<Event>('all').withId(id),
  onEvent: (state, e): TestState => {
    switch (e.eventType) {
      case 'add':
        state.add += 1
        return state
      case 'remove':
        state.remove += 1
        return state
    }
    return state
  },
})

export const TestPond = <E>(events: Record<string, E[]>): RxPond =>
  (({
    observe: <S>(fish: Fish<S, E>): Observable<S> => {
      const tags = fish.where
        .toString()
        .split(' ')
        .map(s => s.substr(1, s.length - 2))
        .filter(s => s !== '&' && s !== '|' && s !== '')

      const es = Object.entries(events)
        .filter(([k]) => tags.every(t => k.split(' ').includes(t)))
        .reduce<Array<E>>((acc, [_, e]) => [...acc, ...e], [])

      return of(
        es.reduce((s, e) => {
          return fish.onEvent(s, e, {
            eventId: '',
            isLocalEvent: false,
            lamport: 0,
            tags: ['all'],
            timestampAsDate: () => new Date(),
            timestampMicros: 0,
            stream: '',
            offset: 0,
            appId: ''
          })
        }, fish.initialState),
      )
    },
  } as any) as RxPond)
