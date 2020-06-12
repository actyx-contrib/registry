![](https://raw.githubusercontent.com/actyx-contrib/registry/master/registry-icon.png?token=AATHWQKNNTOL4FZ7QT2V5SK64QH7Y =130x)

# Registry toolkit

Want to keep track of and work with all fish of a specific type? Meet the RegistryFish pattern.

## scalable, reuseable, composable, and maintainable

One thing that has come up quite a few times is the need to track all fish of a certain kind in someplace. You may have a fish representing a specific entity on your shop-floor. There are going to be many instances of this fish, one for each entity. Now, what if you wanted to show a list of all these entities somewhere?

The registry pattern will lead you to a data model that is **scalable**, **reuseable**, **composable**, and **maintainable**.

Read the blog post about registry fish at [developer.actyx.com/blog](https://developer.actyx.com/blog/2020/06/15/registry-fishes)

## 📦 Installation

Registry toolkit is available as an [npm package](https://www.npmjs.com/package/@actyx-contrib/registry).

```shell
npm install @actyx-contrib/registry
```

## 📖 Example / Tutorials

This library is made to reduce the code you write.

```typescript
import { createRegistryFish, observeRegistry } from '../src'
import { ChatFish, EventType } from "./fish/chatFish"
import { Pond } from '@actyx/pond'

Pond.default().then(pond => {
  export const ChatRoomRegistryFish = createRegistryFish(ChatFish, EventType.message)
  
  observeRegistry(pond, ChatRoomRegistryFish, ChatFish)
    .subscribe(console.log)
})
```

You will find detailed examples [here](https://github.com/actyx-contrib/registry/tree/master/example)

You can access the full api documentation and related examples by visiting:

[https://actyx.github.io/actyx-contrib/registry/index.html](https://actyx.github.io/actyx-contrib/registry)


## 🤓 Developer tools

| Script | Description  |
|---|---|
| `npm run clean` | Clean lib and coverage folders |
| `npm run tsc` | Run TypeScript check |
| `npm run tsc:watch` | Run TypeScript check watch mode |
| `npm run build` | Build project |
| `npm run build:watch` | Build project watch mode |
| `npm run lint` | Check for lint issues |
| `npm run lint:fix` | Check and automatically fix lint issues |
| `npm run test` | Run Jest tests |
| `npm run test:no-coverage` | Run Jest tests and exclude coverage report |
| `npm run license:add` | Append license information to every relevant files |
| `npm run license:check` | Check if license information is present on every relevant files |
| `npm run license:check-dep` | Check the licenses for project dependencies and produce a summary |
