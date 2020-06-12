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
 * Create a registry fish for a given fish type
 *
 * ## example
 * ```typescript
 * const registryFish1 = createRegistryFish(ExampleFish, EventType.create)
 * const registryFish2 = createRegistryFish(ExampleFish, EventType.create, EventType.deleted)
 * const registryFish3 = createRegistryFish(ExampleFish, [EventType.create])
 * const registryFish4 = createRegistryFish(ExampleFish, [EventType.create], [EventType.deleted])
 * const registryFish5 = createRegistryFish(
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
 * @param entityFish Fish to create the registry for
 * @param addEventOrEventHandler EventType or Array of EventTypes to add the source.name to the Registry or an eventHandler for mor complex Registry use-cases
 * @param removeEvent EventType or Array of EventTypes, when the source.name should be removed from the Registry
 */

import { createRegistryFish } from '../src'
import { ChatFish, EventType, CommandType } from './fish/chatFish'
import { Pond, FishName } from '@actyx/pond'

// list all chat rooms with any message in
export const ChatRoomRegistryFish = createRegistryFish(ChatFish, EventType.message)

// list all chat rooms where the last message is not 'close chat room'
export const NotClosedChatRoomRegistryFish = createRegistryFish(ChatFish, event => {
  return event.message === 'close chat room' ? 'remove' : 'add'
})

Pond.default().then(pond => {
  // trace out the state of the ChatRoomRegistryFish
  pond
    .observe(ChatRoomRegistryFish, FishName.of('registry'))
    .subscribe(console.log)

  // trace out the state of the NotClosedChatRoomRegistryFish
  pond
    .observe(NotClosedChatRoomRegistryFish, FishName.of('registry'))
    .subscribe(console.log)


  // use stdin to post some messages
  process.stdin.on('data', data => {
    const chatRoomName = FishName.of('chatRoom')
    pond.feed(ChatFish, chatRoomName)({
      type: CommandType.postMessage,
      sender: 'senderName',
      message: data.toString().trim(),
    }).toPromise()
  })
})
