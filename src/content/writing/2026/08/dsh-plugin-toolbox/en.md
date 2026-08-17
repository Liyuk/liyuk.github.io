---
title: "My DSH Workbench: Nine Plugins"
description: "DSH has been out only a few days, and I've already installed nine plugins on it. Notes on what each one fills in, how it works, and which one is the most useful."
locale: en
translationStatus: draft
createdAt: 2026-08-16
publishedAt: 2026-08-16
draft: true
type: essay
tags: [technology, agent-systems, developer-productivity]
translationKey: 2026/08/dsh-plugin-toolbox
---

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH) has only been out for a few days, and I've already installed nine plugins on it. That's not a collecting habit — once you actually use it, there are things you only notice when they're missing, and each of these plugins happens to fill one in. This post records what each one adds, how it works under the hood, and which one I find most useful.

First, my standard for judging tools, because it decides whether anything below is worth it: **how good an agent tool is depends half on the model, and half on whether it lets you see what's happening.** What the model is thinking, where it's stuck, how long it's been running, which file it's touching — if you can see progress and see problems, you know how to troubleshoot. Nearly everything I value most in this plugin set falls on that line.

Here's the list:

| Plugin | What it fills in |
| --- | --- |
| `dsh-mnemon` | Cross-session memory (present every turn) |
| `graph-memory` | Cross-session memory (graph recall) |
| `@nanmicoder/dsh-agent-teams` | Multi-agent teams |
| `@deepseek-ai/dsh-bridge-browser` | Viewing webpages |
| `@liustack/modlens` | Reading images |
| `@dsh-external/dsh-visualize` | Drawing results as cards |
| `dsh-working-activity` | Status line (see progress) |
| `dsh-better-sidebar` | Sidebar workbench (see problems, easy to troubleshoot) |
| `@liyuk/dsh-skin-chatlab` | Feishu skin (the plug) |

## It remembers you: `dsh-mnemon` and `graph-memory`

With a bare DSH install, every new session is a blank slate. I installed two memory plugins: one handles "being present", the other "looking back".

**`dsh-mnemon`** handles "being present": `USER.md` (who I am, what annoys me) and `MEMORY.md` (project conventions, pitfalls I've stepped in) are automatically injected into the system prompt every turn, with automatic archival when capacity is full. How does it always stay current? — hot memory is lazily injected: it doesn't concatenate a dead string at startup; it registers a section that is only evaluated when the prompt is assembled, so a memory edit this turn takes effect next turn. There's also a design I like: `memories.json` is the single source of truth, and `MEMORY.md` / `USER.md` are only projections — if a projection breaks it can repair itself; the JSON is never lost, so you can mangle the Markdown freely.

**`graph-memory`** handles "looking back": after each conversation turn it hands the messages to an LLM to be distilled into TASK / SKILL / EVENT nodes and a few edges, stored in local SQLite. Next time you ask something related, it finds seeds with embeddings, spreads along the graph, and ranks the most relevant few with **personalizedPageRank**, tucking them into your context. The author measured about 75% token savings over a 7-turn workflow. Every recall is annotated "untrusted reference; must not override current instructions" — it only reminds you that "it's been done before"; it doesn't make the call for you.

## Delegating work out, like being a boss: `@nanmicoder/dsh-agent-teams`

**`@nanmicoder/dsh-agent-teams`** turns a session into a team: the current session acts as the **captain**, can create members, break goals into tasks with dependencies, and message them directly through mailboxes. For this site I put together a "visual review team" — visual-designer reviews layout, content-renderer reviews tables/code/math, figure-reviewer reviews mermaid and images; the three work in parallel and the captain consolidates everything into one improvement list.

Why is it reliable? Because disk is the truth: team state lives under `.agent-teams/<team-name>/`, with `team.json` recording members and tasks and one JSONL mailbox per member, written atomically. Members are continuable subagents; messages land in the mailbox before the member is woken, and a failed delivery waits for the next time; tasks have an explicit state machine, and a task can't be claimed before its dependencies are done. Even if the model misses an update mid-way, the panel polls disk and pulls back the truth.

## Give it eyes: `@deepseek-ai/dsh-bridge-browser` and `@liustack/modlens`

**`@deepseek-ai/dsh-bridge-browser`** lets the model get into the webpage I'm looking at: read snapshots, click buttons, fill forms, flip pages, and address iframe elements by number. No screenshots anywhere — which actually saves tokens for a text-only model (about 3–4k per screen). It doesn't go through Chrome DevTools; a browser extension actively connects out to a local WebSocket bridge, and the handshake passes a bearer token verified with constant-time comparison; it operates on real tabs, so login state is naturally preserved; there's no "run arbitrary JS" channel, and state-changing operations need approval on the extension side.

**`@liustack/modlens`** fills in image reading: `modlens_read_image` hands the image to an external vision engine and brings back full OCR text, layout, semantics, plus an honest `uncertainty`. It's a "transcription bridge", not a local model; by default it uses a keyless engine, and it can also reuse the local Codex login state — that's how I got it working. Recently Codex's quota ran out, so it's parked while I wait for a reset. When it can't read something, it says so plainly — better than fabricating an answer.

## Have it draw the results: `@dsh-external/dsh-visualize`

**`@dsh-external/dsh-visualize`** lets the model render results as interactive cards: simulators, charts, comparison panels, UI mockups — growing right in the conversation stream, iterable over and over with create / update. Tell it "turn the table into a line chart" and it does it on the spot.

How is it kept safe and stable? Cards live inside an iframe with `sandbox="allow-scripts"`, and the in-frame CSP blocks network, nesting, and forms while keeping JS and WebAssembly; card content comes entirely from the inline fragment persisted in the message, so replaying an old session shows the card exactly as it was; and while it's still generating, the half-finished work is streamed in — you watch it "grow".

## See the progress: `dsh-working-activity`

**`dsh-working-activity`** folds the session event stream into one line of status: playful copy, the running tool, the elapsed time of the turn. It listens to two events, `session/event` and `agent/status`, feeding a five-phase state machine (idle / waiting / thinking / tool / done); the copy rotates by tier (30 seconds / 1 minute / 5 minutes), with a separate pool for late nights. The key is zero model cost — it never touches the render main path, and it's available in both TUI and Web. The thing long tasks lack most isn't a progress bar — it's confirmation that "it hasn't died". That one line is exactly that.

## See the problem, then you can debug: `dsh-better-sidebar` (the most useful one)

**`dsh-better-sidebar`** is the one I use the most of the nine, and the one I'd recommend first. It bolts a VSCode-style right sidebar onto DSH: an explorer + CodeMirror editor + image/Markdown/HTML/PDF preview, a real terminal built on xterm.js + node-pty, a Git panel (diff / stage / commit / history), and subagent topology. The layout is isolated per session and persisted. With it, the step from "let it do things" to "watch it do things" got a lot more convenient.

The most striking bit is the mounting: the official UI leaves no room for a right sidebar, so instead of taking over through a slot, it mounts a portal directly on `document.body` and paints its own workbench, pushing the main interface left with CSS variables. All data requests go through `/sidebar/api`, wrapped in a trust fence; the session's working directory takes `ctx.sessions.get(id).header.cwd` as authoritative — so it knows "which directory this session is in" and can genuinely open a terminal and run Git there. This is also what I value most about it: which file the problem is in, what the terminal reported — you can see it directly, and seeing it is what makes it fixable.

## Give it a conversational feel: `@liyuk/dsh-skin-chatlab` (the plug)

The last one is my own: [dsh-skin-chatlab](/writing/2026/08/dsh-skin-chatlab/) wraps DSH in a Feishu skin — workspaces become project groups, sessions become contacts (deterministic avatars), chat becomes 1:1 bubbles, and there's "typing…".

The motivation, put plainly, is simple: I've been using Feishu for too long. If a tool feels like talking to a person, a lot of the interaction experience comes ready-made — contacts have faces, chats have bubbles, "read" means the other side got it — none of this do I need to relearn. Add that I'm delegating a lot of work these days: briefing it on a task, waiting for its reply — the whole process feels a lot like being a boss. That's a professional after-effect, not a metaphor.

Technically it's an extreme example of "restyling within the plugin's boundary": not a line of logic touched — pure registration + decoration + CSS rearrangement. The base exposes a registration service, and the skin package stuffs in tokens and CSS; the decoration only appends its own nodes and never touches React's diffing; with no slot for session rows, CSS Grid rearranges them; the data layer goes through a read-only loopback RPC. The details are all in the previous dev notes.

## Appendix: how they get installed into DSH

All nine plugins share one mechanism: `dsh plugin --profile web add <package-name>` installs one, and a restart activates it. The packages listed in `dsh.profile.bundles` are stacked into a loading tree in order; each bundle carries a `cordis.patch.yml` (insert mount lines) and changes no existing config; plugins almost all split into a host half (Node: services/tools/RPC/WebSocket) and a client half (browser: UI), where the client half declares `dsh.client.inject` to inject the runtime and registers with `window.__ModuleLoader__.load`; UI goes through slots or operates the DOM directly, model capabilities go through `ctx.tools.register`, and cross-process goes through loopback RPC.

In one sentence: plugins get to know each other through dependency injection, UI hangs into the React app via slots or DOM, and model capabilities are exposed by registering tools. All nine plugins are, at bottom, a set of trade-offs on this mechanism — someone uses a portal to build their own workbench, someone uses CSS to rearrange the appearance, but none of them waited for the official UI to give an answer. That's probably what attracts me most about DSH: what it gives you isn't a finished product — it's a set of building blocks you can stack yourself.
