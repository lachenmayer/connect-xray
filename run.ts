import { Scope } from './types'
import { xray } from './xray'

let __cid = 0
const makeCid = () => String(__cid++)

function connect<Sources, Sinks>(
  connector: (sources: Sources, scope: Scope) => Sinks,
  sources: Sources,
  parentCid: string | null // null = root scope
) {
  const cid = `${parentCid ?? ''}/${connector.name}#${makeCid()}`
  const scope: Scope = {
    cid,
    connect: (connector, sources) => connect(connector, sources, cid),
  }
  const tappedSources: Sources = xray(sources, cid, 'source')
  const sinks = connector(tappedSources, scope)
  const tappedSinks = xray(sinks, cid, 'sink')
  return tappedSinks
}

export function run<MainSources, MainSinks>(
  Main: (sources: MainSources, scope: Scope) => MainSinks,
  sources: MainSources
) {
  return connect(Main, sources, null)
}
