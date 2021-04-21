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
import { observeRegistry$ } from './index'
import { Observable } from 'rxjs'
import { Event, registryFish, testFish, TestPond } from './index.spec.testData'
import { take } from 'rxjs/operators'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
describe('registry', () => {
  describe('observeRegistry$', () => {
    it('observe empty reg', async () => {
      const pond = TestPond({})
      const out = observeRegistry$(pond, registryFish, Object.keys, testFish)
      expect(await takeFirst(out)).toStrictEqual([])
    })

    it('observe multi entry reg', async () => {
      const events: Record<string, Event[]> = {
        'all all:a': [
          {
            eventType: 'add',
            id: 'a',
          },
        ],
        'all all:b': [
          {
            eventType: 'add',
            id: 'b',
          },
        ],
      }

      const pond = TestPond(events)
      const out = observeRegistry$(pond, registryFish, Object.keys, testFish)
      expect(await takeFirst(out)).toStrictEqual([
        {
          id: 'a',
          add: 1,
          remove: 0,
        },
        {
          id: 'b',
          add: 1,
          remove: 0,
        },
      ])
    })

    it('observe multi entry and remove one entry again', async () => {
      const events: Record<string, Event[]> = {
        'all all:a': [
          {
            eventType: 'add',
            id: 'a',
          },
          {
            eventType: 'remove',
            id: 'a',
          },
        ],
        'all all:b': [
          {
            eventType: 'add',
            id: 'b',
          },
          {
            eventType: 'add',
            id: 'b',
          },
        ],
      }
      const pond = TestPond(events)
      const out = observeRegistry$(pond, registryFish, Object.keys, testFish)
      expect(await takeFirst(out)).toStrictEqual([
        {
          id: 'b',
          add: 2,
          remove: 0,
        },
      ])
    })
  })
})

const takeFirst = <S>(from: Observable<S>): Promise<S> => from.pipe(take(1)).toPromise()
