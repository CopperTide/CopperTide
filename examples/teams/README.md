# Example teams

Eight example teams. Seven are saved team designs for real projects, written while building the app. The eighth is a portable MADL team that fits any project.

| File | Team | Agents | Shape |
|---|---|---|---|
| `airplane-c172.json` | Airplane · Cessna 172P explorer | 15 Claude | Lead → sources → system builders → behavior → story → explorer → checks |
| `airplane-c172-codex.json` | Airplane · Cessna 172P explorer (Codex) | 15 Codex | Same shape |
| `c172-cad-codex.json` | Cessna 172P · native CAD (Codex) | 16 Codex | Chief engineer → system leads → integrator → independent verifier, clash and mass checks → 3D explorer |
| `live-textbook.json` | Live textbook · Real Analysis Ch. 2 | 6 Claude | Designer → three builders in parallel → assembler → verifier |
| `live-textbook-codex.json` | Live textbook · Real Analysis Ch. 2 (Codex) | 6 Codex | Same shape |
| `math-workbench.json` | Math · interactive workbench | 5 Claude | Designer → builder → two reviewers in parallel → release checks |
| `math-workbench-codex.json` | Math · interactive workbench (Codex) | 5 Codex | Same shape |
| `gstack-roles.madl.json` | gstack-style product team | 8 Claude Code | Think & plan → Build → Review & QA → Ship → Reflect |

These are real agents. **Start team** uses your Claude or Codex sign-in and costs money or plan usage. The airplane team runs up to four sessions at once, and each Claude session can start its own subagents.

## What they need

- A running CopperTide (`coppertide serve`, port `4410` by default). See the [top-level README](../../README.md).
- `claude` or `codex` on `PATH` (or `--claude-program` and `--codex-program` on `serve`), signed in.
- `curl`, `jq` and `uuidgen` to load the project teams.
- For the seven project teams: the projects they were written for. Every agent's `folder` is an absolute path to a SciVizEngine checkout on the original author's computer, and the airplane teams read inputs from an Airplane-Creator checkout. Change these paths before you start a team. Agent folders must be inside the home folder of the user running `serve`.

## Load a team

**The MADL team.** In the app, open the template gallery and use **Import a team from a file** with `gstack-roles.madl.json`. Then set the team's folder to your project. The eight agents play the roles of [gstack](https://github.com/garrytan/gstack) (MIT, Garry Tan), written in our own words. gstack is not required. See [the showcase page](../../docs/showcase/gstack-roles.md).

**The project teams.** Each file is a `TeamDraft` (`web/src/generated/TeamDraft.ts`) at revision 0, which the app cannot import from a file. Load one through the API instead: create a blank team named after the file's `id`, so the new team gets that id, then save the draft over it.

```bash
BASE=http://127.0.0.1:4410
T=airplane-c172                      # the file's id, without .json
F=examples/teams/$T.json

curl -s -X POST $BASE/api/teams -H 'content-type: application/json' \
  -d "{\"request_id\":\"$(uuidgen)\",\"template\":\"blank\",\"practice\":false,\"name\":\"$T\"}"
REV=$(curl -s $BASE/api/teams/$T | jq '.draft.revision')
jq --argjson rev "$REV" --arg rid "$(uuidgen)" '{request_id:$rid, revision:$rev, draft:(. + {revision:$rev})}' $F |
  curl -s -X PUT $BASE/api/teams/$T -H 'content-type: application/json' -d @-
curl -s -X POST $BASE/api/teams/$T/validate -H 'content-type: application/json' -d '{}'   # [] means no problems
```

If a team with that id already exists, the server picks a new id (for example `airplane-c172-2`). Use the id from the POST response in the URL, and set `.draft.id` to it as well.

## Before you start a project team

- **Agent settings.** Every agent uses the default model, unrestricted permissions, and resumes its session if possible.
- **Run folders.** Each team writes to `runs/<team>/<date>/` inside SciVizEngine: `runs/c172/`, `runs/live-textbook/` and `runs/math-workbench/`, with `-codex` folders for the Codex copies. The CAD team works in `runs/c172-cad/2026-10-11/`. The first agent creates the folder and names it on the first line of its reply. Agents never commit.
- **Math workbench topic.** The topic is Fourier series. To change it, edit the `TOPIC:` line in the Workbench designer's Job.
- **Ports.** Agents that serve files use their own ports, so a Claude team and its Codex copy never collide, and none uses 4410 or 4420:

  | Team | Claude | Codex |
  |---|---|---|
  | Airplane explorer | 8771–8785 | 8871–8885 |
  | Live textbook | 8800–8805 | 8900–8905 |
  | Math workbench | 8810–8814 | 8910–8914 |
  | Native CAD | | 8890 |

## How they're tested

- `crates/rigspec/tests/examples.rs` compiles the three Claude teams and their Codex copies with no issue, and checks that each Codex copy has its own ports and run folder.
- `crates/controld/tests/example_gstack.rs` and `madl.rs` check that the MADL team reads with nothing dropped and imports cleanly once a folder is set.
- `c172-cad-codex.json` has no test. Run the `validate` call above after you edit any file.
- No test starts a team or calls a model.

## Limits

- The app cannot import a `TeamDraft` JSON file. Only the MADL team imports from the gallery.
- The project teams depend on folders and inputs outside this repository, as described above.
