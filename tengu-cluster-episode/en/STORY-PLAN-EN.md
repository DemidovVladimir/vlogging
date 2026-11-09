# TENGU EP.02 — Director’s plan

Story: a confident answer is not enough → connected plan → relevant inputs → real boundaries → failure recovery → observability → memory → a useful decision. All examples are authored illustrations, not measured runs.

## 00 / Intro — 00:00–00:03

Click to start the MP4 with sound; let it finish.

## 01 / Inside our Tengu Cluster — 00:03–00:44

Phases (R, then → as you explain):

- config.toml → planner → executor
- run-agent → tool call → step result

## 02 / Who decides what runs next? — 00:44–01:27

Phases (R, then → as you explain):

- The planner sees the configured roster: descriptions, skills and tools.
- A and B are independent, so the executor can run them in parallel.
- C: depends_on = [A, B]. Comparison waits until both results are ready.
- D receives C’s result. A simple question can skip the plan: Direct.

## 03 / One plan step. A separate process. — 01:27–02:13

Phases (R, then → as you explain):

- The parent sends the goal, dependency results and this session’s plan.
- The child loads the configuration of the selected agent.
- Its model/tool loop returns the final result as JSON.

## 04 / Prompts ask. Code checks access. — 02:13–03:01

Phases (R, then → as you explain):

- The agent must be granted the tool. Asking in a prompt is not enough.
- A scope also checks arguments, such as a URL or filesystem path.
- Shell, browser and native CLI tools need their own boundaries.

## 05 / Retry a step ≠ rebuild the plan — 03:01–03:48

Phases (R, then → as you explain):

- Comparison failed. Review waits; source collection is already complete.
- Retry repeats this step after a delay, while attempts remain.
- Replan changes the plan. *Reuse requires the completed step and its dependencies to match.

## 06 / From a failure to a specific call — 03:48–04:31

Phases (R, then → as you explain):

- The recording shows the DAG and selected agents.
- session_id and step_id connect the child’s work to this task.
- Tool events return to the parent’s trace under their step.
- Studio plays the event recording. It does not run tools again.

## 07 / Results now. Memory for later. — 04:31–05:18

Phases (R, then → as you explain):

- output / summary reach the next step over IPC, even without a database.
- With memory enabled, a summary is stored in Postgres + pgvector.
- Recall adds relevant records to a new context; model weights do not change.

## 08 / Not an agent crowd. Controlled execution. — 05:18–05:58

Phases (R, then → as you explain):

- config.toml: agents and permissions
- DAG + IPC: how work moves
- Trace + checks: why trust the result

## Controls & recording

- P: pause/resume; R: reset paused; ← / →: phase back/forward, paused.
- − / +: 0.25×–2×; 0: normal speed.
- Down / PageDown / Space: next; Up / PageUp / Shift+Space: previous. Home / End: intro / closing.
- Wheel / touch: natural scroll. Hidden tabs freeze diagrams. Reduced motion: final phase, manual stepping still works.
- Diagrams hold their final phase rather than looping. Controls do not scrub the MP4.
- Record the deck only. Keep script.html and ?view=plan in a separate LOCAL window/device.
- Timing is a rehearsal target, not auto-advance. Slow down on the plan and permission boundary; do not read source links aloud.
