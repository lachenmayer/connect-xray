import { flow } from 'fp-ts/lib/function'
import { isObservable, Subject, tap } from 'rxjs'
import { TapObserver } from 'rxjs/internal/operators/tap'
import { StreamDirection } from './types'

export function xray<T>(obj: T, cid: string, direction: StreamDirection): T {
  if (isObservable(obj)) {
    return tapDebugEvents('this', direction, cid)(obj) as unknown as T
  }
  const xrayed: T = { ...obj }
  for (const [name, maybeObservable] of Object.entries(xrayed)) {
    if (!isObservable(maybeObservable)) continue
    ;(xrayed as any)[name] = tapDebugEvents(
      name,
      direction,
      cid
    )(maybeObservable)
  }
  return xrayed
}

export const debugEvents = new Subject<{
  timestamp: number
  event: keyof TapObserver<any>
  direction: StreamDirection
  cid: string
  name: string
  value?: any // beware leaks
}>()

function tapDebugEvents(name: string, direction: StreamDirection, cid: string) {
  return flow(
    tap({
      next: (value: unknown) =>
        debugEvents.next({
          timestamp: Date.now(),
          event: 'next',
          direction,
          cid,
          name,
          value,
        }),
      error: (error: unknown) =>
        debugEvents.next({
          timestamp: Date.now(),
          event: 'error',
          direction,
          cid,
          name,
          value: error,
        }),
      complete: () =>
        debugEvents.next({
          timestamp: Date.now(),
          event: 'complete',
          direction,
          cid,
          name,
        }),
      subscribe: () =>
        debugEvents.next({
          timestamp: Date.now(),
          event: 'subscribe',
          direction,
          cid,
          name,
        }),
      unsubscribe: () =>
        debugEvents.next({
          timestamp: Date.now(),
          event: 'unsubscribe',
          direction,
          cid,
          name,
        }),
      finalize: () =>
        debugEvents.next({
          timestamp: Date.now(),
          event: 'finalize',
          direction,
          cid,
          name,
        }),
    })
  )
}
