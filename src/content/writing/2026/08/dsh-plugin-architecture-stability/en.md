---
title: "From “It Runs” to Maintainable: Architecture and Stability Lessons from Building DSH Plugins"
description: "A practical account of developing and debugging ChatLab, Agent Suite, and Quota Router, covering DSH plugin mechanics, common preview-version stability problems, and the boundaries that are easiest to get wrong when building plugins yourself."
locale: en
translationStatus: reviewed
createdAt: 2026-08-19
publishedAt: 2026-08-20
draft: false
type: case-study
tags: [technology, agent-systems, developer-productivity]
translationKey: 2026/08/dsh-plugin-architecture-stability
---

> This is a stage-of-development engineering summary, not an official DSH API specification. The examples come from developing and validating three plugin suites in August 2026: `dsh-skin-chatlab`, `dsh-agent-suite`, and `dsh-quota-router`. They also draw on DSH preview source code, runtime logs, and related fixes. DSH is evolving quickly; after every upgrade, event names, payloads, DOM anchors, and loading behavior must be checked again.

In my previous article, [Nine Plugins for the DSH Workbench](/en/writing/2026/08/dsh-plugin-toolbox/), I described plugins for memory, browsing, status lines, sidebars, and skins. Once I started building plugins myself, the questions quickly changed from “what else can I add?” to: Why does a plugin sometimes load slowly? Why does a code change not take effect? Why can changing only CSS bring down the whole page? Why does a settings page showing candidate models not prove that the runtime actually used them?

These three plugin suites represent three different kinds of plugin engineering:

| Plugin | Main responsibility | Most fragile boundary |
| --- | --- | --- |
| `dsh-skin-chatlab` | Express conversations, avatars, unread state, and runtime status in a Feishu-inspired style | React-owned DOM, state split between host and client, CSS compatibility |
| `dsh-agent-suite` | Record costs in a local ledger, then let monitor and archive consume it | Event normalization, persistence, dependency visibility, settings entry points |
| `dsh-quota-router` | Select models by task and perform bounded fallback along a candidate chain | DSH event semantics, per-turn identity, native model validation, failure classification |

They all lead to the same conclusion: **a DSH plugin is not just JavaScript attached to a page. It is a small distributed system spanning the host process, browser, event streams, configuration, and persisted data.** Stability comes from clear boundaries, not from one successful startup.

## Part One: How DSH Plugins Are Registered, Loaded, and Activated

The mechanism comes first; the practical failures follow. An installed DSH plugin does not become visible through a single import. It follows a lifecycle involving profiles, bundles, host and client entry points, and resource ownership:

```text
Install the npm package
  → register it in a profile / bundle
  → inject host/client entry points through a patch
  → load the entry points with ModuleLoader
  → create a Cordis fiber and resolve inject dependencies
  → register host services, events, and RPC
  → load the client bundle and mount slots/decorations
  → update the UI from events or state snapshots
```

If any step fails, the final symptom may simply be “the plugin does nothing.” Debugging therefore needs to distinguish whether the package is installed, the entry point is loaded, the fiber started, dependencies are ready, and the client actually mounted.

### 1. Profiles, bundles, and patches

DSH plugins are not simply imported into the page. An installation command adds a package to a profile, for example:

```sh
dsh plugin --profile web add <package-name>
```

The profile stores the loading relationships between plugin bundles. A plugin package may also include a `cordis.patch.yml` that inserts its host entry, client entry, or dependencies into the loading tree. This avoids modifying DSH source code directly, but “the package is installed” does not mean every entry point will load as intended. The profile, bundle order, package `exports`, build artifacts, and target DSH version must all agree.

I encountered this while splitting ChatLab into a monorepo. `core`, `skin-feishu`, and the `chatlab` aggregate package have different responsibilities: the skin package obtains the service exposed by core through `inject: ["chatlab"]` instead of importing core internals, while the aggregate package provides an installable combination. A direct import looks simpler, but couples independent bundles and makes upgrade and load order unpredictable.

### 2. A plugin usually has a host half and a client half

Although the three projects do different things, they share the same basic shape:

```text
DSH profile / bundle
        │
        ├── host: Cordis services, event listeners, tools, settings, loopback RPC
        │
        └── client: browser bundle, UI slots, decoration nodes, settings pages, styles
```

The host runs on Node. It is suited to holding facts, subscribing to DSH lifecycle events, accessing local files, and providing controlled RPC. The client runs in the browser. It renders UI, subscribes to client state, and mounts the plugin’s interface. The two sides should not communicate through an accidentally shared in-memory object; they need explicit DSH services, events, settings providers, or loopback RPC.

The boundaries in the three projects are:

- ChatLab’s host handles session previews, unread decisions, and avatar mapping; the client handles skin registration, DOM decoration, and CSS. The skin does not take over chat logic.
- Agent Suite makes the ledger the single source of accounting truth. Monitor only reads the ledger, and archive only reads settled receipts. Monitor does not recalculate cost, and archive should not modify the ledger.
- Quota Router handles profile matching, source priority, model mapping, failure classification, and candidate advancement. Provider registration, credentials, model catalogs, adapter retries, and context compaction remain native DSH responsibilities.

### 3. Slots, services, and DOM decoration are different capabilities

The rough priority is: use a native slot when one exists; use a service or RPC when facts must cross the process boundary; only append DOM decoration at a clear semantic anchor when the feature is purely visual and no slot exists.

ChatLab’s session rows have no per-row slot, so it cannot safely remove and rearrange React nodes. The final approach was to append only plugin-owned nodes and position them with CSS Grid or flex. The right-side workbench also uses a portal, but the portal is the plugin’s own root rather than a way to move nodes managed by React.

```text
Safe: React nodes + plugin-owned decoration nodes + CSS layout
Risky: clear a React container, move React children, or insertBefore a React node
```

The risky approach often does not fail immediately. The error appears during the next React reconciliation as `removeChild`, a missing node, or a white screen. “It looks fine after refresh” is therefore not proof that the integration is safe.

### 4. Registration success does not mean activation

Registration tells DSH that the plugin exists. Activation still requires the patch to find the correct entry, the artifact to exist and be resolvable through `exports`, the host fiber to start, injected services to become ready, and the client bundle to load in the browser before UI or event handlers can connect to the host.

This explains several common symptoms. A host with no UI usually means that the client entry, bundle, or CSS never entered the loading tree. A page that appears but does nothing may mean that the host service is not ready. If installation succeeds but startup produces no plugin logs, check the profile, patch, and build artifacts before changing component code.

### 5. What hot reload actually updates

DSH hot reload does not refresh every layer at once. Client HMR mainly replaces browser bundles. Host hot reload must invalidate the Node-side entry fiber, reload it, and register its resources again:

```text
Edit src
  → watch rebuilds lib
  → client HMR replaces browser modules
  → host hot reload detects the entry change
  → old fiber resources are released
  → the new entry is loaded and registered again
```

If only an indirectly imported sibling module changes, the entry itself may not be invalidated, so host hot reload may require a clean restart. If old listeners, watchers, RPC servers, or ports do not have disposers, repeated reloads create duplicate events, port conflicts, and memory growth. A changed page is only the visible part of successful HMR; correct resource release is part of activation too.

## Part Two: Preview-Version Stability Problems and Their Fixes

### 1. A version number is not one coherent thing

DSH preview packages such as root, web, agent, session, settings, and client runtime may be on different RC versions. While developing Quota Router, target events had to be checked against RC.6 source and real payloads, even as some dependencies had moved toward RC.7 and the official workspace later moved to RC.8. “The types compile” proves only that one dependency set type-checks; it does not prove that the running web profile emits the same events.

For that reason, a plugin should record at least:

- the locked dependency combination;
- event names and payloads tested in practice;
- the profiles and installation methods used;
- which assumptions are public API and which are preview internals;
- which DOM and loading assumptions must be revalidated after an upgrade.

### 2. Similar event names do not imply the same event stream

Quota Router’s first usage-attribution implementation hit this boundary. An assistant message belongs to the `session/event` session stream, not to an app event that can be invented by analogy. `agent/inbox/inserted`, `agent/request`, and `agent/request-error` belong to the agent runtime stream. Their timing, context, and payload shapes differ.

Failure objects are structured values such as `{ message, code, status? }`, not strings to be guessed from. Rewriting integration tests around real payloads made it possible to distinguish `QUOTA`, 401/403, 429, 5xx, and timeout behavior and give each a different recovery strategy.

When debugging preview events, the order should be:

1. Read the target-version source and confirm where the event is emitted.
2. Capture a redacted payload from a real DSH session.
3. Create a minimal fixture for each event shape.
4. Only then connect the handler to plugin logic.

Starting from event names alone is how a plugin ends up with tests that pass while its handler never runs in a real session.

### 3. Host and ecosystem problems I fixed

Plugin work can expose bugs in DSH itself or in adjacent plugins. It is important to separate adapting one’s plugin to a DSH contract from confirming a host or ecosystem defect and preparing a minimal upstream fix.

Two fixes for which I left code, tests, and commit history are:

- **DSH Discussion [#3455](https://github.com/deepseek-ai/deepseek-harness/discussions/3455): entry detection failure with Node 24 and `tsx`.** Several DSH TypeScript scripts relied on `import.meta.main` to determine whether a file was being executed directly. Under the Node 24 loader, the value could be `undefined`, so `pnpm run build` appeared to succeed while producing no runtime artifacts; other gates could also be skipped silently. The fix was not a one-off patch to the build script. I extracted `isEntryModule()`, using the native result when available and otherwise comparing `process.argv[1]` with the current module path, then added regression tests. This directly explained why a plugin package could be “installed” while its web profile lacked host or client artifacts.
- **The `dsh-mnemon` metadata-maintenance fix.** If a subagent generated a title or description that was too long or too short, the old logic failed the entire metadata-maintenance batch and could prevent valid Memory Space updates. The fix skips invalid entries, continues valid updates, and makes no write call when there are no valid updates. Tests cover one valid plus one invalid entry, and the all-invalid case. The practical plugin principle is that model output is an untrusted boundary: one bad item should not turn a whole batch into an unrecoverable failure.

These fixes made one thing clear: plugin stability is not confined to the plugin repository. Host build entry points, tool schemas, event replay, and provider adapters can all determine whether a plugin starts. I also investigated several upstream candidates: an empty Bailian streaming tool-call delta overwriting an existing tool name ([#3464](https://github.com/deepseek-ai/deepseek-harness/discussions/3464)), literal `{{...}}` in an MCP description being mistaken for a prompt variable ([#3454](https://github.com/deepseek-ai/deepseek-harness/discussions/3454)), and an update preceding a start event and preventing a replayed session from loading ([#3450](https://github.com/deepseek-ai/deepseek-harness/discussions/3450)). These are diagnosed candidates, not fixes I claim were merged. The official repository also stated that external pull requests were not currently accepted, so Discussion threads and reproducible patches were the appropriate way to participate.

### 4. Case study: why ChatLab hot reload did not take effect

Early ChatLab development often produced the symptom “the code changed, but the page did not.” The cause was not one cache but two layers:

- client `lib/client.js` had to be rebuilt and then reloaded by DSH client HMR;
- host `lib/index.js` was protected by the `node_modules` boundary, so ordinary client HMR could not be expected to invalidate it.

The development flow eventually became esbuild watch plus client HMR, with `dsh-hot-reload` replacing the host fiber when the lockfile changed and rolling back on failure. This reduced manual restarts, but one boundary remained: it invalidated the entry module only and did not recursively invalidate sibling modules imported by that entry. Changing `projection` while it was imported by `index.js` could still require a clean restart.

An earlier `restart-web.sh` also left an old process holding the port, so a second launch failed with `EADDRINUSE`. It looked like the plugin had crashed DSH, but the real cause was an old web process, hot reload, and a new process coexisting. The first diagnostic questions should be which process owns the port and which package or `lib/` directory the running process loaded.

### 5. Preview UI internals are not stable APIs

Many ChatLab visual bugs were not design problems. They came from relying on internal class names and undocumented DOM structure: avatars, titles, and paths became vertically compressed; the top avatar drifted away from the name and mode labels; the ellipsis wrapped; and dark-mode changes did not really use DSH’s theme management.

The surviving strategy is:

- prefer `data-*`, ARIA attributes, roles, and text semantics as anchors;
- treat compiled internal classes as a temporary compatibility layer;
- do not observe the whole `body` or perform heavy work in a global MutationObserver;
- delegate dark mode to DSH’s theme service instead of creating a second theme state;
- run real-browser regression checks after every upgrade rather than relying only on screenshots or unit tests.

## Part Three: Practical Development Problems — ChatLab

ChatLab encountered several apparently unrelated problems. In the end, most were cases where the display layer had no clearly defined source of truth.

### 1. Skin switching can overwrite the no-skin state

The first skin switcher combined CSS, decoration nodes, and settings state. After switching back to no skin, old styles or nodes still affected the page; unfinished Slack, WeChat, iMessage, and WhatsApp skins could also look clickable. The solution was not more CSS. Each skin needed a stable id, a `ready` state, and a disposable decoration lifecycle. Unfinished skins are disabled explicitly, and `none` is treated as a real recoverable state.

### 2. The blue and red dots that appeared “sometimes”

The first blue-dot implementation used `running` from a `sessions.list` snapshot, while typing and status frames used the live `session.running` value. At the beginning or end of a session, the two sources diverged and the blue dot briefly disappeared. The fix was to prefer the live `ctx.sessions.get(id).running` value for runtime state and use snapshots for other projected fields.

The unread red dot had a similar history. Running state, pending interaction, last-read position, and last-message sequence were mixed into one calculation, so the dot disappeared after a run or was incorrectly suppressed while approval was waiting. The fix split `unreadDecision`, `buildRunningSet`, and related logic into pure functions that distinguish “running” from “waiting for human input.”

The lesson is: **one UI state should not be derived from two sources with different latency semantics.** Define its source of truth, time semantics, and priority before deciding how the component should render it.

### 3. Inconsistent avatars, previews, and history lists

At first, the two sides derived avatars independently, so the host and browser could disagree. The final design persisted the mapping keyed by session id, turning avatar generation from a computation on every render into a stable projection. Live-session previews also had to stop reusing stale `lastActivity`; otherwise a new message could arrive while the list still displayed the old preview.

Problems described as “data cannot render” or “the history list does not load” need three separate questions:

1. Did the host RPC return the correct session facts?
2. Did the client refresh its projection at the correct time?
3. Does React still own the nodes it is rendering?

Changing CSS while looking only at the third question often hides the real RPC or timing problem.

### 4. UI alignment is not a minor detail

Misaligned sidebar avatars and “name + typing” labels, excessive spacing between the top avatar and name, incorrect message-bubble colors, and input fields or brand marks that distorted the native UI all required repeated fixes. The root cause was usually treating a multi-state region like a fixed-height image. Avatar, title, subtitle, time, typing state, and action buttons need explicit flex-shrink, overflow, and alignment rules.

The final approach used smaller decoration nodes, explicit flex/grid columns, text-overflow constraints, and real-browser validation. Visual regressions should cover at least no skin, the target skin, dark mode, empty lists, long titles, subagents, running state, approval waiting, and newly arrived messages.

## Part Four: Practical Development Problems — Agent Suite

Agent Suite’s three packages are not three independent cost calculators. They form a one-way data flow:

```text
DSH lifecycle events
        ↓
ledger: normalized receipts, JSONL persistence, idempotent deduplication
        ↓
monitor: read-only summaries, burn rate, budgets, and diagnostics
        ↓
archive: read-only settled receipts, archive and local game-like projections
```

### 1. The ledger cannot record only “successful cost”

When streaming chunks arrive, final usage may not exist yet, so the ledger can only produce an `estimated` record. After final assistant-message usage arrives, it can merge into `settled`. Models without pricing must be shown as `unknown`, not faked as zero cost. Tool calls should not automatically be counted as one LLM call; at most they can produce a clearly marked approximation.

JSONL append writes, stable event keys, idempotent merges, and replay after restart exist to handle duplicate events, process interruption, and host restarts. If the ledger is correct only in memory, monitor’s attractive numbers have no meaning after a restart.

### 2. Why monitor was “installed but invisible”

During Agent Suite development, monitor was initially misunderstood as an add-on to `dsh-better-sidebar`, so installing it did not reveal either data or an entry point. It became an independent host service with loopback RPC, exposed through a native DSH Settings section and sidebar tab.

Three questions must remain separate: did the plugin load, does the host have data, and does the client have an entry point? Without a ledger, monitor should show a missing dependency rather than a blank screen. Without a writable settings provider, it should clearly show read-only resolved values rather than pretending to save. An invisible tab should pause polling instead of continuously rendering and calling RPC for nobody.

### 3. Archive can be fun without contaminating the ledger

Archive’s draws and points are local, non-tradable game-like projections. It reads only settled receipts, caps per-receipt token points, and can add bonuses for saving strategies and reconciliation. It must not turn the ledger into a score counter designed for draws. The playful layer must depend on the core source of truth, not change it.

## Part Five: Practical Development Problems — Quota Router

Quota Router first looked like “keyword → model → fallback.” In practice, the central problem was not switching models but preserving **why this turn reached a candidate and which chain it should follow after failure**.

### 1. Global source order and task-model mapping must be separate

The same cheap model may be the first candidate for both `coding` and `hard-coding`, while their second candidates differ. If only the current provider and model are stored, a quota failure loses the original task policy. Quota Router therefore separated source priority from `profiles[].modelBySource` and stored `profileId + candidateIndex` for every DSH turn.

Fallback then becomes an auditable ordered chain instead of a fresh guess after every failure:

```text
first-match profile
        ↓
source priority × modelBySource
        ↓
native provider/model validation
        ↓
stable failure: advance immediately
transient failure: retry first, then cooldown before advancing
```

### 2. Stable and transient failures need different treatment

Quota exhaustion, insufficient balance, and 401/403 generally will not recover by retrying the same route, so the router should advance immediately. 429, 5xx, timeouts, and transport interruptions may be transient; DSH’s normal retry should run first, then the router should enter cooldown and advance after the threshold. Context overflow may not be solved by changing models, so it should not trigger blind fallback.

Paid, manual, and emergency sources are opt-in by default. They may appear in the candidate chain, but a free source failing must not silently create spending.

### 3. Settings previews are not runtime health checks

Quota Router’s Settings page eventually gained source ordering, profile mappings, model-catalog completion, and expanded candidate chains. Two opposite problems appeared: some values were hard-coded and therefore not configurable, while showing a candidate chain could make users assume that every provider and model was currently healthy.

The page must distinguish three layers:

| Layer | What the page can say |
| --- | --- |
| User configuration | Source order, profiles, model mappings, paid-source switch, thresholds, and cooldowns |
| Plugin policy | First-match, native validation, failure classification, forward-only behavior, cooldown, and ledger |
| Native DSH layer | Providers, credentials, model catalog, capabilities, adapter retries, and context compaction |

The configuration preview shows the expanded policy result. Actual health comes from host-side native validation, cooldown state, and `quota_router_status`. Saving configuration also needs revision-based optimistic locking so two pages do not overwrite each other.

### 4. Real fallback must be tested in AgentLoop

Making a function return an error proves only that the classifier works; it does not prove that DSH will issue another request in the same turn. Quota Router therefore added real AgentLoop validation: inspect the actual `agent/request-error` payload, same-turn retry, the profile-specific second candidate, and preservation of the original error when the chain is exhausted.

This is where preview plugins most easily overstate their results. Passing unit tests, opening a Settings page, and displaying a candidate chain do not prove behavior under a real provider failure.

## Part Six: Common Problems and Solutions When Building Plugins Yourself

### 1. Editing build artifacts as if they were source code

ChatLab and Agent Suite generate host ESM, client bundles, and package metadata under `lib/`. Editing `lib/client.js` can change the local page briefly, but the change disappears on the next build and makes the tarball inconsistent with source. The correct path is to edit `src/`, run build/watch, then rehearse ModuleLoader loading and npm-tarball installation.

### 2. Validating only the development directory

A monorepo workspace resolving local dependencies does not mean a user installing `dsh plugin add <tgz>` can resolve them. ChatLab’s monorepo boot, the skin-feishu host entry, aggregate-package dependencies, and CSS rebuild all exposed differences between these environments. Before release, inspect `exports`, patch files, bundle fields, the artifact list, and a clean profile.

### 3. Blaming DSH for “slow loading” immediately

Slow startup may come from a host entry waiting on network or file scanning, duplicate registration, an uncleared watcher, a bad dependency boundary, an old process, or too much synchronous work during plugin startup. First identify whether the delay is in the DSH loading tree, host-fiber initialization, client-bundle download, or first rendering. Do not add UI caching merely because startup is slow.

### 4. Falling back to a broader legacy interface on error

At provider, credential, and loopback-RPC boundaries, an explicit 403 or permission refusal must not silently fall back to a broader legacy interface. Older-version compatibility is possible, but security errors should fail closed and expose the reason. Read APIs should be redacted by default; credential-bearing operations should use controlled local write endpoints.

### 5. Failing to make state and resources disposable

Cordis-managed resources such as `ctx.effect` and `ctx.on` can be released with the fiber. Bare `setInterval`, HTTP/WS servers, `fs.watch`, child processes, and DOM listeners need their own disposers. Without them, repeated hot reloads create duplicate events, port conflicts, memory growth, or one message being handled multiple times.

Every plugin should be able to answer:

- Where is each listener registered, and who cancels it?
- Do timers and watchers stop on unload?
- How are client decoration nodes removed, and is remounting idempotent?
- If host reload fails, can the old version continue working?
- After a process restart, which state is restored from disk and which must be cleared?

## Part Seven: Debugging Experience and the Order I Use

When a plugin does nothing, crashes the page, or reports incorrect data, I follow this order instead of changing CSS first:

1. **Confirm versions and installation sources.** Are the running DSH, profile, package versions, lockfile, and `lib/` artifacts one coherent set?
2. **Confirm the loading tree.** Did the patch apply? Are both host and client entries loaded? Are injected services ready?
3. **Confirm the source of truth.** Is this native DSH state, a host projection, a client snapshot, or plugin-owned persistence?
4. **Confirm events.** Which bus emits the event? Does the payload match the real version? Is it duplicated or out of order?
5. **Confirm boundaries.** Did the plugin move a React node, let the client touch host facts directly, or bypass native provider/model validation?
6. **Confirm lifecycle.** Are there old processes, old bundles, duplicate listeners, open watchers, or an old RPC server?
7. **Only then tune styles.** Validate in a real browser with no skin, empty data, long text, dark mode, running state, failure, and post-reload state.

Tests should be layered too: pure functions lock down state machines and failure classification; fixtures lock down real payloads; integration tests lock down host/client/RPC behavior; packaging smoke tests lock down installation shape; real DSH AgentLoop and browser regression tests prove that the plugin is actually connected to the host.

## Conclusion: A Plugin’s Maturity Shows After Failure

ChatLab showed me that visual changes can touch React ownership and live state sources. Agent Suite showed me that cost monitoring needs a single source of truth before it needs a dashboard. Quota Router showed me that model fallback is not simply “switch models”; it is preserving decision identity, classifying failures, and returning spending boundaries to the user and native DSH layer.

I now judge a DSH plugin by whether it can:

- identify which assumptions need revalidation after a preview upgrade;
- avoid silently mixing old state when host and client update separately;
- show the reason for failure instead of silently changing routes or swallowing errors;
- remain idempotent after restart, hot reload, and duplicate events;
- release its listeners, watchers, ports, and DOM nodes cleanly.

DSH provides composable building blocks. The hard part of building plugins is not adding another UI panel. It is making every piece know where its facts come from, when an event can be trusted, where to stop on failure, and how to leave no residue when it exits.

## Public References and Related Projects

- [Nine Plugins for the DSH Workbench](/en/writing/2026/08/dsh-plugin-toolbox/)
- [DSH’s Cordis composition and HMR tutorial](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/cordis-tutorial/06-composition-and-hmr.md)
- [DSH](https://github.com/deepseek-ai/deepseek-harness)
- [dsh-skin-chatlab source and installation guide](https://github.com/Liyuk/dsh-skin-chatlab)
- [ChatLab project page](/en/projects/2026/08/dsh-skin-chatlab/)
- [Quota Router: an explainable multi-source model fallback chain for DSH](/en/projects/2026/08/quota-router/)
- [`dsh-mnemon` PR #38: literal prompt-variable fix](https://github.com/omdsh-dev/dsh-mnemon/pull/38)
- [`dsh-mnemon` PR #32: hardening the structured subagent result channel](https://github.com/omdsh-dev/dsh-mnemon/pull/32)

This article describes plugin architecture and engineering experience. It does not promise compatibility with any DSH preview version. Before release, use the target version’s source, the actual profile, and real runtime logs as the final authority.
