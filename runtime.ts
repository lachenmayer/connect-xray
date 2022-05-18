export type Scope = {
  cid: string
  connect<Sources, Sinks>(
    connector: (sources: Sources, scope: Scope) => Sinks,
    sources: Sources
  ): Sinks
}

let cid = 0
const makeCid = () => String(cid++)

function connect<Sources, Sinks>(
  connector: (sources: Sources, scope: Scope) => Sinks,
  sources: Sources,
  parentScope: Scope | null // null = root scope
) {
  const scope: Scope = {
    cid: (parentScope?.cid ?? '') + `/${connector.name}#${makeCid()}`,
    connect: (connector, sources) => connect(connector, sources, scope),
  }
  const sinks = connector(sources, scope)
  return sinks
}

export function run<MainSinks>(
  Main: (_: undefined, scope: Scope) => MainSinks
) {
  return connect(Main, undefined, null)
}
