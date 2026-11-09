# Editorial and narration standard

## The viewer

An intelligent, curious adult who may not know the implementation. They do not need patronizing explanations of ordinary words. They need the connection: what goes in, what changes, what comes out, why that matters to their work.

The channel is “Practical AI for real people.” Keep human intent and observable results central. A model is not a tiny conscious worker. The kaiju and robot are an identity, not literal hardware operators.

## Build one argument

Before slides, write one sentence: “After this video, the viewer can ___ because they understand ___.”

Prefer a concrete discrepancy over a catalog of vocabulary. Establish a scenario, change one meaningful variable, show the consequence, then give a usable decision. Supporting scenes may explain a mechanism, boundary or exception. If two scenes have the same takeaway, merge or cut one.

Use ordinary transitions that move the argument:
- RU: “Мы изменили только аудиторию. А теперь посмотрим, что будет, если инструкции начнут спорить.”
- EN: “Here, context helps. What if the instructions disagree?”
- RU: “Инструмент принёс новые данные. Но кто написал то, что мы сейчас прочитали?”
- EN: “That’s a useful result. Does the same rule still help after the model changes?”

Do not add generic “Next slide” remarks or recap every section. Do not make every topic repeat the current episode's context → attention → cache sequence. Those are its content, not the channel's permanent outline.

## Concise without losing the cause

Weak: “Attention transforms representations and produces updated activations.”
Better for the reference topic: “Same request, different audience. The model uses that context, so the outline can change.”

The short version still needs a boundary: the attention picture is illustrative, and the whole model generates the answer. Put a concise caveat on screen and the essential explanation in speech. Do not turn every caveat into another slide.

Weak: “Key means key. Value means value.”
Better, only if that detail is needed: explain where the intermediate records are computed and what can be reused. If the video is about conflicting instructions, the arithmetic can be omitted entirely.

Weak: “More context makes answers worse.”
Better: “Useful context can clarify the task. Irrelevant or conflicting instructions can get in the way.”

Weak: “A new model no longer needs tools.”
Better: distinguish an obsolete instruction recipe from a tool that supplies external data or performs an action.

## Narration format

Use the reference structure:
- A short title and production preface.
- One numbered heading per actual scene.
- Short paragraphs of spoken text.
- Bold bridge sentences that are spoken.
- Bracketed stage directions on separate lines; not spoken.
- Sources and technical footnotes in their own document, not read aloud.

The English reference is 589 spoken words. It uses roughly five minutes with pauses at about 135 words/minute. The approved Russian reference is longer and remains unchanged; it is a voice/style reference, not the timing budget for every new episode.

Do not memorize a lecture or create a teleprompter wall. Write a coherent script that can also be paraphrased. Include a cue in the director plan: what the presenter points at or waits for. Avoid promotional superlatives, fake personal stories, repetitive throat-clearing and unexplained abbreviation chains.

## Runtime budgeting

Start with a 300-second envelope:
- Roughly 2–3 seconds for the logo sting.
- Around 20 seconds to establish the consequence.
- The majority for one example and its mechanism.
- A short comparison or caveat where necessary.
- Around 10–20 seconds for the practical close.

This is flexible, not a compulsory segment template. Estimate spoken words / chosen pace × 60 + pauses. Then read it aloud or time the presenter if available. Do not claim a guaranteed duration from word count.

If it runs long: cut duplicate claims → shorten caveats → move optional detail into notes → merge scenes. Do not solve length by making the text tiny or speaking faster.

## Examples and evidence

Comparisons must hold the relevant task constant. In the retained design scene, the image and copy are fixed while the instruction recipe changes. Show actual output shapes, not a label saying “worse result.”

If you have real model outputs, retain prompts, model/version, date, settings and runs needed to interpret them. If not, label the diagram or mockup as illustrative. A new model can be better at some tasks and worse at others; evaluate the actual task.

For new facts, use current primary sources and explain what is simplified. Reuse the presentation architecture, not old provider policies or prices. Do not make claims about real people's subscriptions, shared instances or data isolation without evidence.

## Final editorial pass

Read only headings: do they tell the story? Read only the last sentence of each scene: does the next follow naturally? Remove any sentence that repeats a point without adding evidence, a consequence or an action. Ask whether the viewer can explain the one takeaway without knowing all the technical terms.
