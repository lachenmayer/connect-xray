import { pipe } from 'fp-ts/lib/function'
import { delay, interval, map, merge, Observable } from 'rxjs'
import { run, Scope } from './runtime'

function Main(_: undefined, { connect }: Scope) {
  const numbers$ = interval(1000)
  const { doubled$, doubledAndDelayed$ } = connect(Double, { numbers$ })
  const { delayed$ } = connect(Delayed, { numbers$: doubled$, delayMs: 1000 })
  return { doubled$, delayed$, doubledAndDelayed$ }
}

function Double(
  { numbers$ }: { numbers$: Observable<number> },
  { connect }: Scope
) {
  const doubled$ = pipe(
    numbers$,
    map((x) => x * 2)
  )
  const { delayed$ } = connect(Delayed, { numbers$: doubled$, delayMs: 2000 })
  return { doubled$, doubledAndDelayed$: delayed$ }
}

function Delayed({
  numbers$,
  delayMs,
}: {
  numbers$: Observable<number>
  delayMs: number
}) {
  return { delayed$: pipe(numbers$, delay(delayMs)) }
}

const sinks = run(Main)
merge(...Object.values(sinks)).subscribe(console.log)
