---
name: askme
description: Look at the current session - what was asked, what was done, what was found, and every decision that was deferred, assumed or left open - and put the ones that are the user's to make as multiple-choice questions, then act on the answers. Use when the user says "askme", "/askme", or asks to be asked the open questions from the session.
---

# askme

Turn the session's open decisions into questions the user can answer by
picking an option, then carry out what they pick.

The point: a long session leaves rulings behind. Some were deferred out loud
("your call", "needs a ruling", "filed, not fixed"), some were assumptions
made to keep moving, some were forks where one branch was taken without
asking. Reading a ten-page recap to find them is work the user should not
have to do. This skill finds them and asks.

## 1. Read the session for decisions

Go back through the whole conversation, not just the last turn. Collect every
place where one of these happened:

- A ruling was **deferred** to the user: "your call", "needs a ruling", "not
  decidable from this tree", an issue or tracker item filed as needing a
  spec, a plan section headed with a question, a draft message whose
  questions the user could answer themselves.
- An **assumption** was stated and acted on: "assuming X", "taking the
  narrower reading", a default chosen because nobody said otherwise.
- A **fork** was taken without asking: two ways to do something, one chosen
  for a stated reason, the other still open.
- Work was **left out** or scaled down: "not fixed", "out of scope", "filed
  for later", a red test left standing as pre-existing.
- Something was **built that the user has not seen**: a draft not sent, a
  branch not merged, a change to a shared file that other code depends on.
- A **process** question surfaced: whether to ship, merge, send, delete, or
  re-run something that costs time or is hard to undo.

Skip anything that can be answered from the code, the repo, or the docs.
Look it up instead. Skip anything with a conventional default that was
already applied and did no harm. Skip questions whose answer would change
nothing about what happens next.

If nothing qualifies, say so in one sentence and stop.

## 2. Rank and cut

Order what is left by how much the answer changes: behavior every user sees
before a test's tolerance, a shared file before a local one, a send or a
merge before a rename. Keep the questions that change the next step.

`AskUserQuestion` takes at most **four** questions per call. Ask the four
that matter most. If more remain, say how many and offer a second round as
the last option of the fourth question, or after the answers - never pack
two decisions into one question to fit.

## 3. Write each question

Each question is one `AskUserQuestion` entry:

- `question`: one complete sentence ending in a question mark, carrying
  enough of the situation that the user can answer without scrolling back.
  State the fact that makes it a question (the measured number, the count of
  affected files, the module two components share), not the reasoning that
  found it.
- `header`: a chip of at most 12 characters naming the subject
  (`Default`, `Send reply`, `Merge`).
- `options`: two to four, mutually exclusive, each a real course of action
  that exists - never a strawman. The `description` says what happens if it
  is picked and what it costs: the files that change, the test that has to
  be re-pinned, the person who has to rebuild. If there is a recommendation,
  put it **first** and end its label with `(Recommended)`. If there is not,
  say nothing about recommending.
- `multiSelect`: true only when the options are not exclusive ("which of
  these checks to re-run").
- `preview`: use it when the options are concrete things to compare side by
  side - a code shape, a layout, a wording - and not for a preference that a
  label and a description already carry.

"Other" is always offered by the tool. Treat a free-text answer as the
ruling, verbatim.

Write in plain English: short sentences, no jargon beyond what the reader
needs, no buzzwords, no telling the user what they will think. Do not
restate the session. Do not hedge.

## 4. Ask, then act

Call `AskUserQuestion` once with the batch. When the answers come back:

1. Do what each answer says, in the session, now - apply the change, send
   nothing that was not chosen, re-run what was asked for.
2. Record the ruling where the project keeps rulings, if it keeps them
   anywhere: the tracker item or issue the question came from, the plan
   document, the changelog or history file - one line naming the decision
   and the date. Never mark an item done just because it was ruled on; the
   ruling decides the spec, the code decides done.
3. Report in a few lines: each question, the answer, what was done with it.
   A second round only if step 2 left questions over and the user asked for
   them.

## Don't

- Don't ask what a grep or a read would answer. Look it up.
- Don't ask permission for routine, reversible work. Do it.
- Don't invent an option to make the list longer. Two real choices beat four
  with two padding.
- Don't ask more than four in one call, and don't merge two decisions into
  one question to get under the cap.
- Don't recommend when you have no basis to. A recommendation with a reason
  is welcome; one without is noise.
- Don't restate the whole session in the questions. One fact per question,
  the one that makes it a decision.
- Don't act on an answer that was not given. If the user picks "Other" and
  says "later", it is later.
