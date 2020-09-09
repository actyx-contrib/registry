// import { Observable } from 'rxjs'
import { Fish, FishId, Pond, Tag } from '@actyx/pond'
import { Observable } from 'rxjs'
import { take } from 'rxjs/operators'
import { FishName, generic, RegisterableFish } from './index'

type Event =
    | {
        fish: string
        foo: number
    }
    | {
        fish: string
        foo: string
        bar: number
    }
    | string

type State = string

const TestTag = Tag<Event>('generic-test')
const mkTestFish = (name: FishName): Fish<State, Event> => ({
    initialState: name,

    onEvent: (state, _event) => state,

    where: TestTag.withId(name),

    fishId: FishId.of('test', name, 0),
})

const TestFish: RegisterableFish<FishName, State, Event> = {
    descriptor: 'test',

    makeFish: mkTestFish,

    extractFishName: (e: Event) => (typeof e === 'string' ? e : e.fish),

    events: TestTag,
}

const emitEvent = async (pond: Pond, e: Event) =>
    await pond
        .emit<Event>(TestTag.withId(TestFish.extractFishName(e)), e)
        .toPromise()
        .then(() => new Promise(resolve => setTimeout(resolve, 0)))

const nxt = async <T>(o: Observable<T>) => await take(1)(o).toPromise()

describe('generic registry', () => {
    it('should aggregate known fish', async () => {
        const pond = await Pond.test()

        await emitEvent(pond, 'hello')

        await expect(take(1)(generic.observeAll(pond, TestFish)).toPromise()).resolves.toEqual([
            'hello',
        ])

        await emitEvent(pond, 'another-fish')

        await expect(nxt(generic.observeAll(pond, TestFish))).resolves.toEqual([
            'hello',
            'another-fish',
        ])
    })

    it('should forget about fish', async () => {
        const pond = await Pond.test()

        const all$ = generic.observeAll(pond, TestFish, e => {
            if (typeof e === 'string') {
                return 'remove'
            } else {
                return 'add'
            }
        })

        await emitEvent(pond, 'hello')
        await expect(nxt(all$)).resolves.toEqual([]) // no fish yet!

        await emitEvent(pond, { fish: 'another-fish', foo: 50 })
        await expect(nxt(all$)).resolves.toEqual(['another-fish'])

        await emitEvent(pond, { fish: 'hello', foo: 'x', bar: 5 })
        await expect(nxt(all$)).resolves.toEqual(['another-fish', 'hello'])
    })

    it('should potentially just ignore events', async () => {
        const pond = await Pond.test()

        const all$ = generic.observeAll(pond, TestFish, e => {
            if (typeof e !== 'string') {
                return 'ignore'
            } else {
                return 'add'
            }
        })

        await emitEvent(pond, 'hello')
        await expect(nxt(all$)).resolves.toEqual(['hello'])

        await emitEvent(pond, { fish: 'another-fish', foo: 50 })
        await expect(nxt(all$)).resolves.toEqual(['hello'])

        await emitEvent(pond, 'bar')
        await expect(nxt(all$)).resolves.toEqual(['hello', 'bar'])
    })

    it('should gracefully handle not being handed a fish name for an event', async () => {
        const pond = await Pond.test()

        await emitEvent(pond, { foo: 50 } as Event)

        await expect(take(1)(generic.observeAll(pond, TestFish)).toPromise()).resolves.toEqual([])
    })
})
