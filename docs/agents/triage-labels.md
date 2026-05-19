# Agent Triage Labels

Use this default vocabulary for local markdown planning and triage.

| Role | Label | Meaning |
| --- | --- | --- |
| Needs evaluation | `needs-triage` | A human should decide whether this work belongs in the project. |
| Waiting on reporter | `needs-info` | The task is blocked until more context is provided. |
| Agent-ready | `ready-for-agent` | The task is specific enough for an agent to implement without more human decisions. |
| Human-ready | `ready-for-human` | The task is clear, but should be handled or approved by a human. |
| Will not fix | `wontfix` | The task has been intentionally declined. |

Do not create new label names casually. If the project later moves to GitHub Issues, map these roles to real repository labels.
