---
title: "Where Exactly Is the Cache? Multi-Level Locality in a Multi-Cluster Model Service Proxy"
description: "Using a de-identified multi-cluster model gateway as an example, this article breaks down the multiple levels of locality across LLM conversations, edge routing, in-cluster upstream accounts, and prompt caches, then presents reusable approaches to routing, invalidation, failover, and observability."
locale: en
createdAt: 2026-08-28
publishedAt: 2026-08-28
draft: false
type: essay
tags: [performance, systems-design, algorithms, reliability, observability, routing, technology]
column: { slug: technical-systems, order: 7 }
translationStatus: reviewed
translationKey: 2026/08/cache-optimization-and-locality
---
Cache optimization easily starts with a number: What is the hit rate? If the hit rate is not enough, extend the TTL, add a layer of Redis, and stick more requests to the same machine. This sequence often keeps people busy for a long time without actually answering the question.

When I recently re-examined a set of multi-cluster model gateways, I discovered a more basic question: where is the cache? I initially thought of it as "send the request to the same place as much as possible", but later I discovered that a request coming from the public network will go through at least four places that may affect reuse: conversation identity, edge routing cluster, upstream resources selected by gateways in the cluster, and prompt cache maintained by the provider itself. They are not the same cache, nor the same scheduler.

~~~text
请求
  -> 对话/session 身份
  -> 边缘路由层：服务集群局部性
  -> 集群网关：上游资源局部性
  -> 服务供应商 + 规范化模型 + 稳定 prompt 前缀
  -> upstream prompt cache
~~~

If any layer is broken up, the next layer may become cold again. In turn, forcibly binding all requests to one place will also create hot spots and long tails. What really needs to be defined here is not a certain cache component, but the facts, identities, and invalidation conditions; after the boundaries are clear, it makes sense where to put the cache.

```mermaid
flowchart TB
    A[Client request] --> B[Edge router]
    B --> C1[Service cluster A]
    B --> C2[Service cluster B]
    C1 --> D1[Cluster gateway]
    C2 --> D2[Cluster gateway]
    D1 --> E1[Upstream resource pool]
    D2 --> E2[Upstream resource pool]
    E1 --> F[Provider cache domain]
    E2 --> F
    B -. session / time bucket .-> G[(Locality signal)]
    D1 -. provider / model / resource .-> H[(Capacity and health facts)]
    D2 -. provider / model / resource .-> H
```

The most easily overlooked thing in the picture are the two sets of dotted lines: the locality signal only tells the route "where to get closer first", and the capacity and health facts determine "whether it can go there now". None of them are prompt cache itself.

Go through a request completely and the boundaries will be clearer. Assume that the client brings a stable conversation ID: the edge router first combines it with the current time bucket into a sticky key, and then selects a service cluster with fresh capacity evidence; if all snapshots are expired, the cluster is regarded as unknown, instead of directly determining that there is no capacity. After the request enters the cluster, the gateway then uses `provider + canonical model + conversation ID` to find the upstream resource binding. If the bound resource is still available, keep this locality; if the resource is unavailable, let least-busy select another one and record this switch in attempt. Finally, only the cache-read token returned by the provider can prove that the prompt cache actually hits.

There are three results that cannot be confused in this path: successful routing does not mean that the prompt cache is hit; upstream resource switching does not mean that the session ends; and the final success of the request does not mean that the backend only tried once. Each subsequent design is to protect one of the boundaries.

```mermaid
flowchart TB
    subgraph S[Cluster selection]
        direction LR
        A[Receive request] --> B[Session signal]
        B --> C[Choose cluster from fresh capacity]
    end

    subgraph R[Resource binding]
        direction LR
        D[Find binding by provider + model] --> E{Resource available?}
        E -- Yes --> F[Reuse binding]
        E -- No --> G[Least-busy fallback]
    end

    subgraph X[Execution and recovery]
        direction LR
        H[Call upstream] --> I{Retryable result?}
        I -- Yes --> J[Exclude tried clusters]
        I -- No --> K[Return result and record cache-read]
    end

    C --> D
    F --> H
    G --> H
    J --> C
```

## A counterexample to desensitization: the hit rate has gone up, but the system has not improved.

There is a class of callers that send nearly the same long template over and over again without providing a real conversation ID. The system can only generate a stable hash from the first few messages, and then treat this hash as a short-term session signal. This initially looks like an efficient optimization: requests for the same template are sent to the same service cluster, and the provider's cache-read will increase.The problem soon appeared with another picture. This hash represents "template", not "conversation". The larger the template traffic, the easier it is to be concentrated into the same cluster; the resource binding within the cluster keeps some requests in the same lane. Other clusters and resources are obviously idle, but because upstream snapshots, edge stickiness, and intra-cluster scheduling do not know each other's choices, they can only wait for TTL expiration, resource cooling, or request failure before redistribution.

Later, if the time bucket is shortened, hot spots will be alleviated; if unavailable resources are handed over to least-busy, faults will also converge. But this is just a few patches stacked on top of each other. The real problem is: a signal that does not represent a dialogue is used to affect multiple scheduling layers at the same time, and each layer regards its own local optimum as global locality. The hit rate is improved, but the tail latency and capacity utilization are not necessarily improved.

The conclusion left by this counterexample is that weak identity can only be used as a soft preference at best and cannot be a cross-layer hard binding; the service cluster and the resources within the cluster cannot each have a set of sticky states that are unaware of each other. You must first answer "What determines the provider's cache domain?" and then decide which layer is responsible for sending requests to this cache domain.

## First confirm what you are measuring

If each record has `input_tokens` and `cache_read_tokens`, a common token cache hit rate is:

$$
cache\_hit\_rate = \frac{\sum cache\_read\_tokens}{\sum input\_tokens}
$$

The denominator already includes the input token read from the cache, the uncached input token, and the token newly written to the cache, so the cache token cannot be added again. More importantly, you should sum and then divide, rather than calculating the percentage of each request and then averaging.

This and request hit rate answer different questions: request hit rate focuses on how many requests have at least one cache read; token hit rate focuses on how many input tokens are covered by cache reads. A large prompt may contribute the vast majority of tokens, so a few large requests can significantly change the token hit rate. It is suitable for answering how much the input cost is reused, but it cannot directly answer how much the user request is faster.

Model mixing can make this number even more misleading. Assume that a certain type of model occupies the vast majority of input tokens, but its service provider cache-read signal is close to zero; another type of model maintains a high hit rate on multiple service clusters. Combining them into an overall number, what you get is mostly the composition of the traffic, not necessarily the quality of the caching strategy.

Therefore I will look at at least three tables at the same time:| Perspective | Questions suitable to answer |
| --- | --- |
| Cluster total | How many of the current real input tokens have been read and reused? |
| provider × model | Which models differ on which clusters? |
| Fixed model weight | If the traffic composition remains unchanged, has the strategy itself become better? |

Simple averaging cannot be used directly between clusters. When one cluster processes a lot of tokens and the other processes very little, averaging over multiple percentages makes no business sense. The weight should come from the denominator of the same indicator, and clusters with different traffic sizes cannot be regarded as several experimental groups of equal size.

## The first thing: separate the request identity and session identity

A request requires a request ID for auditing and idempotence; a conversation requires a session identity for locality. The two cannot be substituted for each other.

Edge routing will generate a server UUID for each request and concatenate it with the request/trace ID of the internal gateway. The request ID passed by the client can only be used for debugging and cannot be used as the trace primary key because the client can send the same value repeatedly. Similarly, a hash of the prompt content can help with ad hoc routing, but cannot impersonate the real conversation ID.

The priority of session identity should be fixed and the source noted:

~~~text
供应商特有的 session header
  -> 供应商 metadata 中的 session
  -> 兼容客户端的 session header
  -> generic session header
  -> affinity header
  -> client request correlation ID
  -> body.session_id / sessionId
  -> prompt_cache_key
  -> conversation / conversation.id
  -> metadata.user_id
  -> conversation_id
  -> opening messages 的稳定 hash
~~~

The key to this chain is not to "find as many strings as possible", but that strong signals must come before weak signals. `metadata.user_id` often represents an entire user or account, not a conversation; the hash of opening messages may allow all independent runs using the same template to share an identity. They can be used as short-term routing hints, but they do not have the same life cycle as real sessions.

Three small things need to be done when implementing: remove blanks from explicit IDs, reject control characters and long values; add namespace to the ID, such as `provider-a:...`, `provider-b:...`, `pck:...`; return `{ id, source }` instead of just returning a string. The namespace prevents the collision of the same opaque ID in different protocols, and the source allows the trace to explain "why this request is stuck."

If you want to use session facts for billing or reconciliation, you cannot directly save the original text. An independent secret should be used for versioned HMAC, and only hash, source, confidence and version number should be persisted. The current route stickiness can only exist in memory and trace summary; session-level reports must define coverage separately, and sticky keys cannot be upgraded to historical session facts afterwards.## The second thing: cluster stickiness of edge routing

Edge routing is responsible for answering "Which service cluster should the request go to first?" and is not responsible for selecting specific upstream resources within the cluster. Candidate clusters come from a capacity snapshot table: each `(cluster, provider)` has `ready_count`, `cooling_count`, `total_count` and `updated_at`.

Candidate judgment needs to distinguish three states:

~~~text
fresh snapshot + ready > 0       -> 正常候选
fresh snapshot + ready == 0      -> 有证据证明没有容量，排除
没有 fresh snapshot              -> 未知；允许探测，不要替网关返回 503
~~~

This "unknown does not equal empty" rule is important. There may be no data temporarily due to newly added service clusters, snapshot table truncation, or refresh task failure. If no snapshot is regarded as zero capacity, the failure of the refresher itself will be magnified into unavailability of the entire site. The real capacity authority is the gateway within the cluster; when the edge route is not known, the request should be handed over to the gateway for judgment.

`cooling` is not equal to null either. A service cluster may still have upstream resources, but they are waiting for a cooling window with temporary throttling. You can use the normal available number as the weight; if all resources are cooling, give the cluster a small minimum weight instead of deleting it immediately. In this way, a cluster with a real headroom will clearly win, but when the entire service pool is briefly cooling down, traffic can still reach the place where it is most likely to recover quickly.

When there is a session key, it is suitable to use weighted rendezvous hashing:

$$
score(c) = \frac{-\ln(H(sessionKey, c))}{weight(c)}
$$

Get the cluster with the smallest score. `H` must be a stable hash that relies only on input, and cannot use random state in isolate. In this way, the same key will stably fall into the same cluster when the candidate set remains unchanged; when adding or removing a cluster, only the affected keys need to be migrated, and all keys will not be changed together like `hash(key) % N`. When there is no session key, it degenerates into random selection weighted by capacity.

The session key also requires an absolute time bucket:

~~~text
strong conversation signal -> session-id + hour bucket
weak user/message signal     -> signal + short bucket
no signal                    -> weighted random
~~~

The time bucket is not the idle timeout, but the upper limit of forced re-bucketing. A long session that is never quiet cannot occupy the same cluster permanently; a weak signal, especially a weak signal, cannot put all the traffic of a fixed prompt template on one machine. In practice, fixed template traffic is easily concentrated in a single cluster for a long time. Short buckets are designed to solve this problem of "seemingly high hit rate but actual capacity imbalance".

## The third thing: upstream stickiness within the clusterAfter the request reaches the cluster, the work of edge routing has been completed. Only the gateway in the cluster can see which upstream credentials the machine has, which resources are cooling, and whether a certain model is unavailable for a certain resource. So don't let edge routers select resources based on a snapshot from a few seconds ago; that would duplicate an existing scheduler and introduce a more serious stale state problem.

The session-affinity of the gateway in the cluster can be understood as "caching with rollback":

~~~text
cache key = provider + session identity + canonical model

cache hit + bound resource still available
  -> reuse the resource
cache hit + bound resource unavailable
  -> fallback selector chooses another available resource, rebind
cache miss
  -> fallback selector chooses resource, then bind
~~~

Here you must put `provider` and the normalized `model` into the key. The same session may first request one model and then request another model that is only supported by some upstream resources; if only the session ID is used, incorrect binding will cause the originally available resources to be skipped, or the identities of different service providers will be mixed together.

There are two types of fallback selectors for cluster gateways: round-robin and least-busy. Round-robin is suitable for situations where the request costs are close; however, a long streaming turn may occupy upstream resources for several minutes, while a short classification request only takes up one second. In this case, rotation based on the number of requests will continue to send new requests to already busy resources. least-busy maintains the `inFlight` count of each upstream resource, selects the smallest value among the candidates, and then uses round-robin to break the tie.

`Acquire` must occur before the actual call to upstream, and `Release` must cover success, error, timeout, client cancellation and end of stream. It is best to wrap the release function with once: streaming requests often have multiple ending paths, and repeated releases will make the resources appear to be more idle than they actually are, and then all traffic will be sucked through.

session-affinity should not bind weak identities permanently. Keys such as `message-hash` and `user` can participate in the cluster stickiness of short TTL at most; in the cluster, durable resource binding can even be directly bypassed and handed over to least-busy. Otherwise, the fixed template will merge different conversations into one resource, and the user identity will put the entire heavy users on one resource.

## Resource stickiness, hot spots and warm set

Single binding works well for serial sessions: successive requests for the same session land on the same upstream resource, and the prompt cache has a chance to stay warm. But concurrent sessions expose its boundaries. When two requests arrive at the same time, they may both read the same bound resource and occupy this lane together; if both requests fail and then fallback respectively, the binding may be overwritten repeatedly.If the business does have high concurrency and long sessions, the single binding can be evolved into a warm set with an upper limit: one primary, plus one secondary; it will only be expanded when concurrency pressure is observed. Don't scale by lifetime request count, since a session that's a few thousand per day but always serial doesn't constitute a hotspot; scale by active request, reservation, and duration.

This solution requires an explicit concurrency protocol:

1. Read the lane in the lock and count `reserved + active` into the pressure.
2. Reserve candidate lanes in the lock to prevent two requests from considering the same account free at the same time.
3. Call the fallback selector after releasing the lock. Network calls cannot be placed in the lock.
4. Use generation or CAS to confirm that the candidate still belongs to the current binding; if it is taken away by others, reselect it.
5. Only accounts that successfully complete a request can become durable warm lanes; failed fallback should not pollute the next request.
6. Set a hard cap, idle TTL, and failed eviction rules for the warm set.

Warm set is a compromise between capacity and locality, rather than letting each session light up the entire resource pool. It is an evolution after the single-binding solution is squeezed out of the bottleneck by real concurrency; without observational proof, single primary + fallback is easier to explain and easier to recover.

## Failover must log attempt

Stickiness can never become hard binding. Cluster snapshots may be stale, upstream resources may happen to trigger temporary throttling, and network links may be interrupted. Requests should be made with a set of `tried clusters` for limited failover, rather than excluding only the machine from the last attempt: the weighted rendezvous score is stable, and if all tried clusters are not excluded, the next round may immediately select back the place that just rejected it.

Only retry results that clearly indicate "this service cluster is temporarily unavailable", such as transmission failure, temporary unavailability, or throttling; errors actually returned by the upstream do not necessarily mean that the cluster can be safely retried. Each attempt records at least:

~~~text
trace_id, attempt_no, cluster_id, gateway_request_id,
started_at, completed_at, status, transport_ok, outcome
~~~

The end user receiving a successful response does not mean that the backend only made one attempt. Stuffing `initial_cluster`, `final_cluster` and a piece of JSON into the trace can work first, but if you want to do reliable reconciliation, the attempt should ultimately be a first-class fact. Failed transfer attempts cannot be miscalculated as user consumption; session summary should only aggregate traces that ultimately meet the billing criteria.Upstream resources within the cluster can also return stable internal attribution headers; edge routing reads this for attribution and troubleshooting, then strips off all internal routing headers before returning to the client. Public APIs should not reveal internal resource numbers, management information, or routing details; if compatibility with old headers is required, they should also be cleaned up at the boundary layer.

## single-flight, TTL and expiration

Locality solves "where it should go" but does not solve cache reconstruction under concurrency. When multiple requests find the same snapshot at the same time or the aggregation result expires, single-flight is required: the first call registers the in-flight promise, subsequent calls share it, and finally write it back only once.

Registration must occur before the first `await`. Otherwise, both calls can read the miss first and hand over the execution right before registration, and single-flight will be useless. The in-flight key must also contain all parameters that affect the calculation results; the same cache key cannot mask different providers, models, or permissions.

Single-flight typically only covers one edge running instance or one in-cluster gateway process. Cross-machine shared KV/Redis is suitable for pool-load snapshots with short TTL, but is not suitable for carrying resource ownership that must be strongly consistent. When the shared cache read fails, local computing must be returned; writeback can be a best effort, and a recoverable observation cache failure cannot be turned into a user request error.

TTL determines both "how long values ​​can be reused" and "how long errors can be hidden". Can be layered semantically:

| Data | Suggestion Semantics |
| --- | --- |
| pool-load / cluster snapshot | Short TTL; bounded stale-if-error allowed on source failure |
| Model catalog or aggregated results | Medium TTL; expires and refreshed by next access |
| Facts inside request/turn | Do not write long-term shared cache |
| Upstream resource ownership and security status | Not replicating to cache that cannot interpret ownership for hit rate |

The stale-if-error must preserve the original `updated_at` and mark the route trace with `stale=true`. The success of the current read does not mean that the old snapshot is newer; if no evidence is retained, the scheduler will quietly regard the capacity a few minutes ago as the real-time capacity.

Failure can also race against ongoing computations:

~~~text
generation = 7
  -> 计算 A 读取 generation 7
  -> invalidate: generation = 8, delete old value
  -> 计算 B 写入新值
  -> 计算 A 完成，不能把 generation 7 写回
~~~

Therefore, the generation is remembered at the beginning of the calculation and compared before writing back; the generation is incremented when it fails. If a race condition may still occur between checking and writing, you can check again after writing and delete the value just written if it is found to be invalid. Caching is not about "reading and writing a few lines of code". As long as calculations are delayed and invalidations can occur concurrently, you must define when the old value cannot be returned.## The observation contract must cover the entire chain

Only recording the final cache hit is not enough to locate the problem. Each request should be able to associate at least:

~~~text
request_id / trace_id
provider, canonical_model
session source（不一定是原文）
sticky bucket
initial cluster, candidate clusters, final cluster
snapshot age, ready_count, cooling_count, selection reason
attempt list and failover reason
internal upstream id（内部/受限）
cache read/write tokens, input tokens
TTFT/total latency, status, timeout, throttling
~~~

Only aggregated results are displayed externally. The session hash, internal upstream identification, prompts, Authorization, API keys, and raw headers should not enter public reporting or alerting systems. The log should be able to answer "Why was it not reused this time?", but it should not copy the private facts to more places in order to answer it.

It is recommended to put the following indicators in the same analysis table:

| Level | Indicator |
| --- | --- |
| session → cluster | session coverage, cluster switching rate, sticky source distribution |
| cluster → resource | resource cache hit, binding miss, unavailable reselect, in-flight p95 |
| resource → provider | model/cache key compatibility rate, current limit/cooldown, upstream TTFT |
| Overall | token hit rate, request hit rate, p50/p95 TTFT, failover, success rate |

If the production database does not yet hold strict session facts, report `not_collected` explicitly rather than using cluster, client request ID, or temporal proximity to infer a seemingly complete session. Real-time deductions should still use trace as the only fact; session can only be a recalculated aggregation and interpretation dimension.

## Privacy and information boundaries

Observations and attributions of model serving systems require preservation mechanisms but should not expose system maps. External instructions only retain roles and algorithms, and do not expose values ​​that can locate the actual deployment: warehouse name, domain name, IP, machine name, cluster number, number of accounts, capacity limit, traffic proportion, real time window, log path, management interface, key name or the original name of the internal header. The `edge router`, `gateway`, `cluster-a` and `internal upstream id` in the example are just roles and placeholders.Privacy boundaries don’t just remove prompts, either. Session/conversation ID, request ID, API key, Authorization, OAuth information, account email, user ID, exact IP, UA, original header, complete request/response, reversible hash, and combined fields that can re-assemble multiple requests back to the same user should not enter external materials, screenshots, sample logs, or public data sets. When statistics need to be displayed, aggregated proportions or intervals are used, and small samples are suppressed; when correlations need to be displayed, newly generated forged IDs are used, and real values ​​cannot be truncated to look anonymous.

Internal systems can retain finer traces and upstream attribution, but external interfaces and technical descriptions only describe field categories, lifecycles, and access boundaries. This allows the algorithm to be reproduced without exposing specific vendor accounts, deployment topology, capacity scale, or real user behavior.

## Is this the optimal solution?

Not necessarily. To be more precise, the previous solution is a progressive repair of the existing multi-level proxy system: first, let the existing edge routers and cluster gateways avoid fighting with each other, and then use observations to confirm where there are real cache benefits. Its advantage is that it has small changes and can be rolled out layer by layer; the price is that there are still two sets of scheduling states, two capacity views and two types of failure times. The session has one binding at the edge layer and another within the cluster, and either layer may override the decision of the previous layer due to staleness or unavailability.

If it could be redesigned, I would prioritize "cache domain" over "multi-level stickiness":

~~~text
cache domain = provider + canonical model + compatible prompt prefix
                         + resource capability

one scheduler prefers a cache domain
  -> chooses a service cluster with fresh capacity
  -> chooses a compatible upstream resource inside it
  -> falls back when load, health, or capability disagrees
~~~

The focus here is on an authoritative scheduler and a soft preference. A session is not directly bound to an account or machine, but rather improves the score of a cache domain; load, health, capacity, and cooling status can override this preference at any time. The cluster is only responsible for providing available execution locations. The cluster no longer reinvents a set of session bindings that have nothing to do with the edge layer, or at least passes the edge selection into a clear routing lease instead of leaving it to downstream guessing.

This direction is generally cleaner than current solutions, but it's not unconditionally better. It requires a unified scheduling protocol, shared or propagable capacity facts, and provider cache keys that are sufficiently stable. If the account credentials can only be kept on the local machine and the upstream cache does not guarantee cross-resource reuse at all, the scheduler cannot pretend to have a global cache domain; at this time, the most reliable design is to let the local gateway control the final selection, and the edge layer only does coarse-grained health and capacity routing.

Therefore, the judgment criterion is not "the more stickiness, the better", but the following three questions: whether the cache domain really corresponds to the provider's reuse boundary; whether the component that selects the cache domain has enough fresh capacity; whether the system can complete fallback in a clear place when the soft preference fails. When the three answers cannot be true at the same time, no matter how beautiful rendezvous hashing is, it will only make the wrong layering more stable.```mermaid
flowchart TB
    G[Design goal: reuse stable prompt prefixes with capacity and failure isolation]

    subgraph B[Core capability layers]
        direction LR
        F[Layer 1 · Domain facts<br/>Cache domain → provider · model · prefix<br/>Capacity evidence → fresh · zero · unknown<br/>Resource capability → health · cooldown · model]
        R[Layer 2 · Routing policy<br/>Session signal → strong · weak · none<br/>Cluster selection → weighted rendezvous<br/>Soft preference → time-bounded]
        X[Layer 3 · Execution and recovery<br/>Resource binding → provider · model · session<br/>Load balancing → least-busy · round-robin<br/>Fallback → retry · reselect · attempt]
        F --> R --> X
    end

    subgraph O[Guard rails and feedback]
        direction LR
        O1[Metrics → cache-read · latency · load]
        O2[Trace facts → request · session · attempt]
        O3[Privacy boundary → hash · aggregate · access control]
    end

    G --> B
    B -. governed and measured by .-> O
    B --> I[Invariant: locality is a preference; health and capacity can always override it]
    O --> I
```

This picture does not draw the system into several services, but breaks it down into several types of capabilities that must be separately responsible. The upper layer first defines reuse boundaries and capacity facts. The middle layer turns sessions into time-limited soft preferences. The lower layer is responsible for actual execution and recovery. The bottom layer stipulates which facts can be observed and which information must be isolated. The most important constraint is: locality can increase priority, but health and capacity can always override it.

## A reusable implementation sequence

If it is a gradual transformation, a similar system is suitable to be implemented in the following order instead of adding Redis at the beginning:

If it is a new system, the "cache domain, capacity fact and unique scheduling right" should be written into the interface contract first, and then decide whether the following compatibility layers are needed; otherwise, it is easy to solidify temporary patches into the architecture.

1. First write pure functions and tests: session identity priority, namespace, weak signal TTL, canonical model, stable hash, candidate set and failover exclusion.
2. Record initial/final cluster, candidate, snapshot age, attempt and final upstream attribution in the request trace; first make "where the cache is" visible.
3. Implement fresh/unknown/zero capacity rules and weighted rendezvous for edge routing; keep weighting random when there is no session.
4. Implement the TTL binding of `provider + session + model` in the gateway within the cluster, and return unavailable resources to least-busy/round-robin.
5. Add Acquire/Release pairs to least-busy, and test cancellation, timeout, repeat end and stream error.
6. Add single-flight, generation invalidation and bounded stale-if-error to snapshot/aggregation results.
7. Shadow first, then small traffic canary; compare by provider/model, cluster and fixed traffic weight, instead of just looking at a fleet hit rate.
8. Only increase the warm set with an upper limit after observation proves that concurrent sessions are indeed suppressing the primary lane.
9. If session-level reports are needed, add HMAC session fact and coverage separately; do not turn routing heuristic directly into settlement facts.Acceptance should also be a constraint, not a single target: while the token hit rate is improved, the cluster/resource switching rate cannot be out of control, p95 TTFT, current limiting, timeout and failover cannot be worsened, hotspots cannot hold down a single lane for a long time, and unavailable cache cannot block the main process. Especially when the cache-read signal of a certain type of model is close to zero, first confirm the upstream cache semantics and buried point analysis, and then decide whether the route needs to be changed.

Cache optimization ultimately comes back to a simple judgment: first figure out where reuse occurs, and then decide what should be kept together, when moves are allowed, and when old values ​​must be discarded. The cache is not an isolated Redis, it is a local system composed of request identity, model, account, cluster, time and concurrency.
