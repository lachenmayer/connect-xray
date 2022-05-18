import { pipe } from 'fp-ts/lib/function'
import {
  combineLatest,
  delay,
  interval,
  map,
  Observable,
  switchMap,
} from 'rxjs'
import { run } from './run'
import { Scope } from './types'
import { debugEvents } from './xray'

function Main(_: undefined, { connect }: Scope) {
  const numbers$ = interval(647)
  const { doubled$, doubledAndDelayed$ } = connect(Double, { numbers$ })
  const delayed$ = connect(Delayed, { input$: doubled$, delayMs: 930 })
  const ui$ = combineLatest({ doubled$, delayed$, doubledAndDelayed$ })
  return { ui$ }
}

function Double(
  { numbers$ }: { numbers$: Observable<number> },
  { connect }: Scope
) {
  const doubled$ = pipe(
    numbers$,
    map((x) => x * 2)
  )
  const delayed$ = pipe(
    interval(5000),
    switchMap((i) => connect(Delayed, { input$: doubled$, delayMs: 587 * i }))
  )
  return { doubled$, doubledAndDelayed$: delayed$ }
}

// A sink can also just be a single observable.
function Delayed<T>({
  input$,
  delayMs,
}: {
  input$: Observable<T>
  delayMs: number
}) {
  return pipe(input$, delay(delayMs))
}

const { ui$ } = run(Main, undefined)

ui$.subscribe((ui) => console.log('[UI]', ui))
debugEvents.subscribe((event) => {
  console.log(
    '[DEBUG]',
    event.timestamp,
    event.cid,
    event.direction,
    event.name,
    event.event,
    event.value
  )
})
