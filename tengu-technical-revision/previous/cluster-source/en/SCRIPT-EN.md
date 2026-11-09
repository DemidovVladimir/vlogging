# TENGU EP.02 — Tengu Cluster — from a request to real work

Spoken script. Bold bridges are spoken; bracketed cues are not. About five minutes including pauses; estimated, not a timed presenter read.

## 00 / Intro

[Start the intro with sound. After 2.4 seconds, move to 01.]

## 01 / A good answer isn’t a finished task

A studio needs a newsletter service. You ask AI to compare three options, check their terms, and recommend one. It returns a confident list. But are the prices current? Did anyone check the limits?

That gap between a polished answer and completed work is what we’re addressing with Tengu Cluster. It’s our open-source harness: software around models and tools that organizes their work. This walkthrough is an illustration, not a recorded run.

**Start with the plan.**

## 02 / One task. Connected steps.

The planner sees the configured agents and their capabilities. It can answer directly or propose a plan. Here, one worker collects service terms while another extracts the studio’s requirements. Independent steps can run together.

Comparison waits for both results. A reviewer then checks the draft against the sources. Did we compare one service’s annual price with another’s monthly price?

The reviewer isn’t automatic: we configure that role and include it in the process. The planner proposes; the harness dispatches steps according to their dependencies.

**Each worker also needs the right inputs.**

## 03 / Not every agent needs the same things

Each agent has its own model, instructions, skills, and tools. The researcher needs access to sources. The editor needs collected facts and comparison criteria. The reviewer needs the draft and supporting material.

The harness assembles context and passes results between connected steps. This doesn’t mean every agent continually reads everybody else’s conversation.

Tengu has connections through Codex, Claude Code, OpenRouter, and a local model server. Different roles needn’t use different models. Choose and test the setup for your task.

**Now, what stops an unwanted action?**

## 04 / Permission to read isn’t permission to buy

Our request says “don’t buy anything.” That instruction matters, but it isn’t enough for access control. Give the researcher access to the necessary websites without providing a way to purchase a subscription.

Tengu configures tools and access boundaries, such as permitted folders and network hosts. The model proposes an action; code executes it under those restrictions.

But removing a payment tool while leaving an unrestricted browser or shell with payment credentials would miss the point. Check the entire configuration. This reduces risk; it doesn’t promise perfect safety.

**Allowed actions can still fail.**

## 05 / One failed step. Not all work lost.

The sources are collected, but the comparison step fails, perhaps because a model call breaks. The harness can retry, then request a new plan after those attempts are exhausted. Both have configured limits.

Replanning can reuse successful steps when those steps and their dependencies haven’t changed. It needn’t restart all the research.

A completed step still isn’t proof of a correct conclusion. That’s why we included a separate review.

**To diagnose failure, we need an execution trail.**

## 06 / Inspect more than the final answer

Tengu records events: the accepted plan, started steps, tool calls, and errors. In the local Tengu Studio interface, you can inspect the graph and walk through recorded events.

Instead of “the model got it wrong again,” you can identify the step to investigate. Replaying events doesn’t repeat purchases or other actions. And it isn’t a window into the model’s hidden reasoning: it shows what the software did.

**What carries over to the next task?**

## 07 / The next task needn’t start from nothing

With long-term memory enabled, Tengu can save a summary and retrieve relevant information later. The studio’s requirements might help with a future comparison.

That doesn’t retrain the model. Retrieved information enters the new context. Old prices may have changed, so memory still needs checking.

This memory is optional. Without it, results still pass between steps in the current plan.

**The goal isn’t to maximize agent count.**

## 08 / Not more agents. Clearer work.

Ask what counts as done, who can do what, and how you’ll check the work. A simple question may need one model call. Multiple agents add time, cost, and failure points as well as capability.

Tengu Cluster is useful when organizing that work explicitly helps. Start with one task and minimal permissions. Add complexity when you know which problem it solves.

[Hold the three questions. Keep the full bird, robot and logo in frame.]
