export type Scope = {
  cid: string
  connect<Sources, Sinks>(
    connector: (sources: Sources, scope: Scope) => Sinks,
    sources: Sources
  ): Sinks
}

export type StreamDirection = 'source' | 'sink'
