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
/*
 * generated fish pattern with visual studio code extension Actyx-Pond
 * VS Marketplace Link: https://marketplace.visualstudio.com/items?itemName=Actyx.actyx-pond
 */

import { Fish, FishId, Pond, Tag } from '@actyx/pond'

/*
 * Fish State
 */
export type State = {
  roomName: string
  users: Array<string>
  messages: Array<string>
}

/**
 * Fish Events
 */
export type JoinedEvent = {
  eventType: 'chatJoined'
  chatRoom: string
  username: string
}
export type MessageEvent = {
  eventType: 'chatMessage'
  chatRoom: string
  username: string
  message: string
}
export type Event = MessageEvent | JoinedEvent

const emitJoinedEvent = (pond: Pond, chatRoom: string, username: string): void => {
  pond.emit(chatTag.withId(chatRoom).and(chatJoinTag.withId(chatRoom)), {
    eventType: 'chatJoined',
    chatRoom,
    username,
  })
}
const emitMessageEvent = (
  pond: Pond,
  chatRoom: string,
  username: string,
  message: string,
): void => {
  pond.emit(chatTag.withId(chatRoom), {
    eventType: 'chatMessage',
    chatRoom,
    message,
    username,
  })
}

const chatTag = Tag<Event>('chat')
const chatJoinTag = Tag<JoinedEvent>('chat.join')

/*
 * Fish Definition
 */
export const ChatFish = {
  tags: {
    chatTag,
  },
  of: (roomName: string): Fish<State, Event> => ({
    fishId: FishId.of('com.example.chatRoom', roomName, 0),
    where: chatTag.withId(roomName),
    initialState: {
      roomName,
      users: [],
      messages: [],
    },
    onEvent: (state, event, { timestampAsDate }): State => {
      const [time] = timestampAsDate()
        .toTimeString()
        .split(' ')
      switch (event.eventType) {
        case 'chatJoined':
          if (!state.users.includes(event.username)) {
            state.users.push(event.username)
          }
          state.messages.push(`${time} - ${event.username}: joined`)
          return state
        case 'chatMessage':
          state.messages.push(`${time} - ${event.username}: ${event.message}`)
          return state
      }
      return state
    },
  }),
  roomRegistry: {
    fishId: FishId.of('com.example.roomRegistry', 'reg', 0),
    initialState: {},
    where: chatJoinTag,
    onEvent: (state, event) => {
      state[event.chatRoom] = true
      return state
    },
  } as Fish<Record<string, boolean>, JoinedEvent>,
  userRegistry: {
    fishId: FishId.of('com.example.userRegistry', 'reg', 0),
    initialState: {},
    where: chatJoinTag,
    onEvent: (state, event) => {
      state[event.username] = true
      return state
    },
  } as Fish<Record<string, boolean>, JoinedEvent>,
  emitJoinedEvent,
  emitMessageEvent,
}
