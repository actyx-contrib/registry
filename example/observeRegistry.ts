/*
 * Copyright 2021 Actyx AG
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

import { observeRegistry } from '../src'
import { ChatFish } from './fish/chatFish'
import { Pond, AppManifest } from '@actyx/pond'

console.log('\nMake sure Actyx is running\n\nEnter your name: ')
process.stdin.once('data', data => {
  const username = data.toString().trim()
  const chatRoomName = `ChatRoom ${Math.floor(Math.random() * 10)}`

  console.log(`Welcome ${username} to the random chatroom: ${chatRoomName}`)

  const manifest: AppManifest = {
    appId: 'com.example.registry-example',
    displayName: 'Registry Example',
    version: '0.0.1',
  }

  Pond.default(manifest).then(pond => {
    ChatFish.emitJoinedEvent(pond, chatRoomName, username)

    // trace all massages from all chat rooms
    observeRegistry(pond, ChatFish.roomRegistry, Object.keys, ChatFish.of, allChannels => {
      console.log(allChannels)
      console.log(`Enter your message for channel ${chatRoomName}: `)
    })
    // use stdin to post some messages to chatRoom 0 to 10
    process.stdin.on('data', data => {
      const message = data.toString().trim()
      ChatFish.emitMessageEvent(pond, chatRoomName, username, message)
    })
  })
})
