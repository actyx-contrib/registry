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
 * observeRegistry can be used to map the state of an registryFish to the entity fish
 *
 * If you have a complex registry fish that need to map the state to a fishName array,
 * @see observeRegistryMap it take a map function to translate the state.
 *
 * @param pond pond instance or pond.observe function
 * @param registryFish Registry fish which state is a FishName[]
 * @param entityFish entity fish to observe the state
 */

import { createRegistryFish, observeRegistry } from '../src'
import { ChatFish, EventType, CommandType } from "./fish/chatFish"
import { Pond, FishName } from '@actyx/pond'

export const ChatRoomRegistryFish = createRegistryFish(ChatFish, EventType.message)

Pond.default().then(pond => {
  // trace all massages from all chat rooms
  observeRegistry(pond, ChatRoomRegistryFish, ChatFish)
    .subscribe(console.log)

  // Use a map function for the registry fish to trace all massages from all chat rooms
  // observeRegistryMap(
  //     pond,
  //     AdvancedChatRoomRegistryFish,
  //     // map the fish state to an array of FishName
  //     state => state.activeChatRooms,
  //     ChatFish
  //   )
  //   .subscribe(console.log)

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
