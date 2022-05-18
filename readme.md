# connect-xray

> A proof-of-concept reactive architecture which allows inspecting all data flow within an app.

Note: this is a potential evolution of the frontend architecture we are currently using at [Picnic](https://www.picnic.chat/). If this looks interesting to you, please get in touch with me at harry@picnic.ventures - I'll be able to give more context, and would love to hear any thoughts.

## Concepts

A **connector** is a function `Sources => Sinks`.

A **source** is a connector's input. This could either be static data, ie. **constants**, or dynamic data, ie. **streams**.

A **sink** is a connector's output. Similarly, this can either be static or dynamic.

A connector can call **child connectors** using the function `connect`.

Every connector instance is identified by a **cid**, which is a unique name. Each cid contains a fully-qualified path of every parent connector instance.

A connector's **scope** provides access to `connect` and a connector's cid.

Execution of an app is started using `run`. This sets up the root scope which is passed to the root (main) connector.

The **xray** takes every connector's sources & sinks, and emits every event (next/error/complete/subscribe/unsubscribe/finalize) from each stream, annotated with the connector's cid.

## Possibilities

This opens up several possibilities:

- **Debug tools.** For example an "activity monitor" which has a hierarchical tree view of every single connector in the app. `xray` is the simplest possible proof of concept of this.
- **Remote connectors.** Because each connector is pure and has a globally unique id, it is possible to schedule connectors remotely and route source streams to a specific connector instance, no matter where it is executing. This makes connectors similar to an Erlang process, except that each connector can have multiple "mailboxes" (ie. source streams).
- **Supervision trees.** The hierarchical nature of `connect` makes it possible to build Erlang-style [supervision trees](https://adoptingerlang.org/docs/development/supervision_trees/). We could create policies for what should happen if any or all streams in a connector get into an error state, eg. restarting that connector, or even restarting all connectors of that type (see article for possible strategies).

## Proof of concept

- `app.ts` contains a (very stupid) app which sets up some basic connectors. This is meant to demonstrate the user-facing API, ie. `connect` & `run`. It does some arbitrary things happening at arbitrary times.
- `run.ts` implements `run` & `connect` and also `xray`s the sources & sinks.
- `xray.ts` pipes every observable on a source/sink object to a subject called `debugEvents`.

Run the proof of concept using `yarn && yarn start`.

This emits a bunch of lines which look like:

```
[DEBUG] 1652910764442 /Main#0/Delayed#2 source input$ next 12
[DEBUG] 1652910764727 /Main#0/Delayed#2 sink this next 10
[DEBUG] 1652910764893 /Main#0/Double#1/Delayed#3 sink this subscribe undefined
[DEBUG] 1652910764894 /Main#0/Double#1/Delayed#3 source input$ subscribe undefined
[DEBUG] 1652910764894 /Main#0/Double#1 source numbers$ subscribe undefined
[DEBUG] 1652910765093 /Main#0/Double#1 source numbers$ next 7
[DEBUG] 1652910765546 /Main#0/Double#1/Delayed#3 sink this next 0
[DEBUG] 1652910765547 /Main#0/Double#1 sink doubledAndDelayed$ next 0
[DEBUG] 1652910765547 /Main#0 sink ui$ next { 'doubled$': 14, 'delayed$': 12, 'doubledAndDelayed$': 0 }
[UI] { 'doubled$': 14, 'delayed$': 12, 'doubledAndDelayed$': 0 }
```

The lines starting with `[DEBUG]` are the debug events emitted by `xray`. The format is:

- timestamp
- cid
- direction: source | sink
- name
- event: next | error | complete | ...
- value (if any)

The `[UI]` line here is a basic example of "real" app sink output. In this app, this uses a `combineLatest` to combine a bunch of streams together. We can now debug easily why the first UI takes a long time to load.
