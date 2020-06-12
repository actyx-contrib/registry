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

/**
 * create an internal registryFish and return a stream of the state of all _registered_ entryFish as Array
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
 * @param entityFish entity to create RegistryFish and observe the state
 * @param addEventOrEventHandler EventType or Array of EventTypes to add the source.name to the Registry or an eventHandler for mor complex Registry use-cases
 * @param removeEvent EventType or Array of EventTypes, when the source.name should be removed from the Registry
 */

import { observeAll } from '../src'
import { ChatFish, EventType, CommandType } from "./fish/chatFish"
import { Pond, FishName } from '@actyx/pond'

Pond.default().then(pond => {
  // trace all massages from all chat rooms
  observeAll(pond, ChatFish, EventType.message).subscribe(console.log)

  // use stdin to post some messages to chatRoom 0 to 10
  process.stdin.on('data', data => {
    const chatRoomName = FishName.of(`chatRoom ${(Math.random() * 10).toFixed()}`)
    pond.feed(ChatFish, chatRoomName)({
      type: CommandType.postMessage,
      sender: 'senderName',
      message: data.toString().trim(),
    }).toPromise()
  })
})
