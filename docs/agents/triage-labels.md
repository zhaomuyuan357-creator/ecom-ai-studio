# Triage Labels

The engineering skills use five canonical triage roles. This repo keeps the default label strings unchanged.

| Label in mattpocock/skills | Label in our tracker | Meaning                                  |
| -------------------------- | -------------------- | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | Requires human implementation            |
| `wontfix`                  | `wontfix`            | Will not be actioned                     |

## How to use these labels in this repo

- Put the current state near the top of each local issue file as `Status: <label>`
- Change the status when the task moves from discovery to execution or back to clarification
- Prefer `ready-for-agent` only when a task is specific enough that someone can execute it without needing more product explanation

## Example

```md
# Build detail-page long preview

Status: ready-for-agent
Owner: unassigned
Related: PRD.md, public/index.html
```
