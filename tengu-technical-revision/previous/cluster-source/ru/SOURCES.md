# TENGU Cluster episode — evidence ledger

Checked 2026-10-22. Primary source: the owner's local checkout of DemidovVladimir/tengu-cluster at 9805470d751bc7fb18b4fa96153c1b095cdb73e6. Tracked files read; untracked research and private runtime data not used. Public repository availability checked independently. No live agent calls, paid experiments or financial actions were run.

| Claim | Primary source | Boundary |
| --- | --- | --- |
| Open Rust harness, configured agents, engines | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/README.md | Connections exist; no claim all backends have passed identical live tests. |
| Planner returns direct response or a dependency plan; workers run as subprocesses | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/docs/architecture-2026-04-27.md ; https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/src/bootstrap/orchestrator.rs | Example roles are authored, not a bundled newsletter template. No autonomous permission creation. |
| Ready steps run in parallel; results pass upstream to downstream | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/src/application/orchestrator/executor.rs | No claim of universal speedup or perfect context isolation. |
| Retry and replan budgets; reuse identical finished steps with reusable dependencies | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/src/application/orchestrator/replan.rs ; https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/src/application/orchestrator/executor.rs | Technical completion is not semantic correctness; budgets can end in failure. |
| Per-agent model/skills/tools and scoped actions | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/src/adapters/inbound/cli/run_agent.rs ; https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/src/domain/scope.rs | Complete configuration matters; shell/CLI/browser routes must also be constrained. Not an OS-isolation or perfect-safety claim. |
| Studio graph and recorded event replay | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/docs/studio-2026-10-08.md | Local interface. The episode's diagram is not a screenshot; event replay is not tool execution or hidden reasoning. |
| Optional Postgres memory, step summaries and recall | https://github.com/DemidovVladimir/tengu-cluster/blob/fdfdc2eb1961964b33f154a829550ded52acb279/docs/architecture-2026-04-27.md | Requires postgres_memory and configured store/recall. No weight updates; without it output still travels over IPC. |

## Deliberate omissions

No invented performance metrics, costs, adoption numbers or guarantees. No live run claimed. No full feature catalog: recurring runtimes, A2A, trading, SOE, Tor and seal proxy are outside this five-minute story. In particular, the seal proxy's implementation is not described as a deployed service. The source contains older docs with superseded ChatWorker / Qdrant descriptions; these were not used as the current architecture.

## Authored example

Compare three newsletter services for a studio. Sources + criteria → comparison → configured reviewer. There are no actual service prices, names, recommendations or recorded outputs. Payment is an illustrative unavailable capability, not a claimed built-in newsletter checkout tool.
