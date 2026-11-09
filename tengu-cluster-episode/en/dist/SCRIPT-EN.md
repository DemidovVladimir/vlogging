# TENGU EP.02 — Tengu Cluster — inside our harness

Spoken script. Bold bridges are spoken; bracketed cues are not. About six minutes including pauses; estimated, not a timed presenter read.

## 00 / Intro

[Start the intro with sound. After 2.4 seconds, move to 01.]

## 01 / Inside our Tengu Cluster

What did we actually build in Tengu Cluster? Not another model, and not just a set of roles in a system prompt. It is a Rust harness: software that turns a task into controlled execution. It selects agents, starts them, passes results and records failures.

Take a comparison of three newsletter services: find their terms, compare them consistently, then check the conclusion. This is an authored example, not a recorded run. But the components on screen come from our actual code. **First, who decides what happens?**

## 02 / Who decides what runs next?

The config.toml file defines available agents, including their models, skills and tools. Their descriptions form the roster presented to RagPlanner. The planner does not browse websites itself. It returns either a direct response or a plan.

A plan contains dependencies, not just suggestions. Sources and evaluation criteria can run independently. DagExecutor can start both in parallel. Comparison waits for both results; review waits for comparison.

The executor’s code enforces that order. We are not relying on the model remembering a scheduling instruction. **So how does one step actually run?**

## 03 / One plan step. A separate process.

SubprocessRunner launches a child process of the same program: tengu run-agent. It sends JSON through standard input: the goal, session and step identifiers, dependency results and the current plan for that session.

The child loads its selected agent’s configuration: engine, model, skills and tools. Inside it, a model/tool loop runs. The model requests a tool, receives its result and continues, within a configured round limit.

Finally, JSON carrying the output and summary returns to the parent. A separate process does not mean a separate model instance or a secure virtual machine. **Action boundaries are a separate responsibility.**

## 04 / Prompts ask. Code checks access.

Tengu asks two different permission questions. Is this tool available to the agent? And are the arguments of this particular call allowed? A reading tool may be available while the requested URL falls outside its permitted scope.

On the guarded call path, code rejects that request. That is stronger than asking “please avoid other sites” in a prompt. But it is not complete isolation. Broad shell access, a browser or an external CLI’s native tools can offer another route.

Here, a sandbox configuration is a package of settings and restrictions, not an operating-system sandbox. **Now suppose an allowed operation still fails.**

## 05 / Retry a step ≠ rebuild the plan

Retry repeats the same step after a delay. It helps with temporary technical errors. Replan does something different: after attempts are exhausted, the planner receives the failure and can propose another plan, provided its budget allows.

Completed work does not always need to run again. The executor can reuse a result when the step and its dependencies match. Sharing the same name is not enough.

Attempts, replans and step duration are bounded. And a process can exit successfully while producing a wrong conclusion. Answer quality still needs an explicit check. **Diagnosing that requires more than the final response.**

## 06 / From a failure to a specific call

Studio exposes the graph and its connected execution recording. A plan event leads to a step; a step leads to tool calls. Session and step identifiers connect the child process’s work to the original task.

If comparison fails, we can inspect whether it started, which tool it called and how that call ended. That is more actionable than rewriting the entire prompt at random.

Replay means replaying recorded events. It does not execute tools again or reveal hidden model reasoning. **There is one more distinction: passing a result versus keeping memory.**

## 07 / Results now. Memory for later.

A step’s result reaches downstream steps through IPC: communication between processes. That does not require a database. Memory across tasks is a separate, optional connection to Postgres with pgvector.

The agent can call compress_and_store to produce a summary and, when storage is enabled, retain it. If it does not call the tool, the implementation can fall back to its final text. For a later task, recall selects relevant records and adds them to context.

This is not model training. Old decisions can become outdated, so recalled information still needs checking. **We can now reduce the architecture to three questions.**

## 08 / Not an agent crowd. Controlled execution.

Who is configured, and what can each agent do? How do dependencies and result passing control execution? Which events and checks support the final result?

That is what our harness adds around the models. Not magical autonomy, but a concrete execution mechanism. Independent steps can run in parallel, failures have bounded recovery paths, and results can be traced.

If one model call solves the task, this machinery may be unnecessary. It earns its place when dependencies, real actions and understanding what happened become important.
