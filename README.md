# ContextLoop

**Persistent project memory for ChatGPT, with optional prompt launching and automated continuation.**

ContextLoop uses **plain-text files in your GitHub repository** to carry project context between ChatGPT conversations. Ask ChatGPT to load a file containing instructions for maintaining that context. As you work, those instructions direct it to record useful decisions and progress, verify GitHub updates, and report failures. Resume in a new chat by loading the latest file. Persistence depends on successful GitHub access and writes; it is not guaranteed.

The optional **ChatGPT Prompt Launcher** Chrome extension provides one-click context loading, colored bookmarks, tab activity indicators, prompt import/export, **Auto-Continue**, and **conversation rollover**. You can use ContextLoop without the extension.

## Contents

- [What you can do](#what-you-can-do)
- [Quick start: persistent context](#quick-start-persistent-context)
- [How context maintenance works](#how-context-maintenance-works)
- [Working with multiple contexts](#working-with-multiple-contexts)
- [Install Prompt Launcher v91](#install-prompt-launcher-v91)
- [Save, launch, and transfer prompts](#save-launch-and-transfer-prompts)
- [Colored bookmarks and tab indicators](#colored-bookmarks-and-tab-indicators)
- [Auto-Continue: long-running assignments](#auto-continue-long-running-assignments)
- [Automatic conversation rollover](#automatic-conversation-rollover)
- [Recommended workflows](#recommended-workflows)
- [Troubleshooting and recovery](#troubleshooting-and-recovery)
- [Security, privacy, and limitations](#security-privacy-and-limitations)

## What you can do

| Capability | What it provides | Requires extension? |
| --- | --- | --- |
| Persistent project context | Preserve decisions, findings, constraints, and unfinished work across conversations | No |
| Autonomous context maintenance | Ask ChatGPT to reconcile new information with the canonical GitHub file | No |
| Verified saves and version history | Refetch after writing; recover older versions using Git history | No |
| Multiple projects | Keep independent context files and explicitly switch among them | No |
| Prompt buttons | Launch reusable prompts from the ChatGPT sidebar | Yes |
| Colored bookmark launchers | Open a saved prompt using a colored Chrome bookmark | Yes |
| Tab state indicators | Identify prompt-associated tabs and distinguish working/ready states | Yes |
| Prompt transfer | Copy/paste prompt definitions between extension installations | Yes |
| Auto-Continue | Repeatedly send a continuation message after completed responses | Yes |
| Stop conditions | Stop after a cycle limit, elapsed-time limit, or assistant completion marker | Yes |
| Conversation rollover | Start a successor chat after a configured number of cycles and resume the loop | Yes |

ContextLoop is not a separate AI model or a background service. ChatGPT and its connected GitHub tools do the context work; the extension automates browser interactions.

## Quick start: persistent context

### 1. Prepare GitHub access

Create a public or private GitHub repository for your contexts. Connect GitHub to ChatGPT with **read and write access** to that repository; connection controls vary by account and interface.

For example:

```text
my-contexts/
  research.txt
  career.txt
  software.txt
```

Use separate files for unrelated projects to avoid mixing their context.

### 2. Create your first context

Copy [startercontext.txt](startercontext.txt) into your repository, rename it (for example, `research.txt`), and replace the sample project details with your goals, constraints, progress, decisions, and open questions.

The starter has two parts: a **global directive** that identifies the canonical GitHub file and instructs ChatGPT when to read, update, verify, and report on it; and a **project-specific context** that evolves as you work.

**Never store passwords, tokens, or other secrets in context files.** Private repositories can hold nonpublic project details, but are not secrets managers.

### 3. Load the context

Start a new ChatGPT conversation with:

> Load and read `research.txt` from my GitHub repository `your-username/my-contexts` and use it as the active project context for this conversation. Treat that GitHub file as the canonical persistent context and follow its directive.

Replace the example filename and repository. Confirm that ChatGPT actually fetched the file. If it could not, check the GitHub connection and repository permissions.

### 4. Work and save

Work normally: ask questions, research, write code, analyze documents, and make decisions. The directive instructs ChatGPT to preserve useful information. You can also request specific maintenance:

- "Record that decision in the active context."
- "Consolidate the context without losing unresolved issues."
- "Review the current context before answering."
- "Update the plan and preserve what remains unfinished."

ChatGPT should **refetch the file after saving** to verify the write. If it cannot save, it should identify the unsaved changes rather than claim success.

### 5. Resume in another conversation

Start a fresh chat with the same loading prompt. ChatGPT should fetch the **latest GitHub version**, not rely on the previous conversation. This is useful when a chat becomes long, slow, or difficult to navigate.

## How context maintenance works

The intended cycle is:

1. **Read** the current canonical GitHub file and its blob SHA.
2. **Do the substantive work** requested by the user.
3. **Reconcile** new decisions, progress, useful hypotheses, and unresolved tasks with the existing project state.
4. **Integrate** changes into the best existing sections rather than endlessly appending chat transcripts.
5. **Write** using the current blob SHA, avoiding blind overwrites.
6. **Verify** by refetching the updated file.
7. **Report** whether the context was read, updated, unchanged, or blocked.

Context maintenance should be secondary to accomplishing the task, not a replacement for it. The global directive is intended to remain unchanged during routine maintenance; modify it only when explicitly requested. This is a **prompt-level convention**, not an access-control mechanism.

### What belongs in a context?

Preserve objectives, nonnegotiable constraints, preferences that affect work, important decisions and rationale, completed work, rejected approaches (to avoid repeating them), pending tasks, known failures, and recovery instructions. Condense repetitive discussion into clear current state. Distinguish established results from hypotheses and tentative plans.

For long projects, consider sections such as **Goal**, **Constraints**, **Current state**, **Completed**, **Open questions**, **Next steps**, and **Lessons learned**. Git history can retain obsolete versions, allowing the current file to stay useful.

### Failure recovery

A GitHub update is not complete just because a tool call was attempted. If the update fails, keep the intended changes in the conversation, refetch the latest file and SHA, retry safely, and report anything still pending. If the previous context-status note reported unsaved changes, reconcile those before declaring the next turn complete.

## Working with multiple contexts

Maintain separate files for different areas of work. For example, `career.txt` may track opportunities and rejected options, while `software.txt` tracks APIs, tests, and bugs.

- **Switch active context:** "Load `software.txt` from `your-username/my-contexts` and make it active."
- **Consult without switching:** "Read `career.txt` for relevant constraints, but keep `research.txt` active."
- **Cross-project synthesis:** "Compare the decisions in these two contexts; don't merge their files."
- **Consolidate:** "Remove duplication and obsolete statements from the active local context, preserving important history and unresolved work."

Short aliases like "load career" are convenient after the repository/file mapping is established, but a fresh conversation should use a fully qualified repository and filename.

## Install Prompt Launcher v91

**Current published package:** [ChatGPT-Prompt-Launcher-v91.zip](ChatGPT-Prompt-Launcher-v91.zip) — extension manifest version **0.19.40**.

The extension is distributed as an **unpacked Chrome extension**, not through the Chrome Web Store.

1. Download the ZIP and extract it into a permanent directory.
2. In Chrome, open `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the extracted directory containing `manifest.json` at its top level.
5. Open or reload [ChatGPT](https://chatgpt.com).
6. Click the Prompt Launcher toolbar icon to open its settings page. Saved prompt buttons appear near the top of ChatGPT's left sidebar.

**Important:** Keep the extracted folder in place. Chrome loads the extension from that folder. Do not choose the ZIP itself or a parent directory that does not contain `manifest.json`.

The extension requests Chrome `storage`, `bookmarks`, and `tabs` permissions, and page access for `chatgpt.com` and `www.chatgpt.com`. Review the extracted source before installation. Avoid enabling multiple copies at the same time: they can interfere with tab state and browser automation.

## Save, launch, and transfer prompts

### Create a saved context launcher

Open the extension settings using its toolbar icon, then:

1. Click **Add prompt button**.
2. Enter a recognizable name such as "Research".
3. Paste the **complete context-loading prompt**, including the repository and filename.
4. Choose its color with the hue slider.
5. Repeat for other projects or frequently reused prompts.

The prompt name is a label, not the text sent to ChatGPT. You can also save non-context prompts, such as a code-review instruction or a writing workflow. Reorder prompts by dragging their handles in Settings; this does not reorder Chrome bookmarks.

### Launch behavior

- **Normal click:** Launch the saved prompt in the current ChatGPT tab.
- **Ctrl-click / middle-click:** Use Chrome's native new-tab behavior.
- **Saved bookmark:** Click its colored bookmark to launch the associated prompt.

The launcher submits the saved prompt; it does not itself fetch or synchronize GitHub files. The connected ChatGPT session performs the GitHub read/write operations after receiving your prompt.

### Copy and paste prompts between installations

Settings includes **Copy prompts** and **Paste prompts**. Use these to migrate prompt definitions between compatible extension installations.

The transfer includes **names, prompt text, colors, and order**. It does **not** transfer bookmarks. Pasting replaces the destination prompt set after confirmation and assigns new prompt identifiers, so existing bookmark associations in that installation may no longer work. Review your destination prompts and regenerate bookmarks afterward. This is a configuration transfer, not a GitHub context backup.

## Colored bookmarks and tab indicators

### Create and maintain bookmark launchers

For a nonempty saved prompt, use **Add bookmark** in Settings. Prompt Launcher places its bookmark at the far left of Chrome's bookmarks bar. You can update/refresh or delete an individual prompt bookmark, or use **Delete all bookmarks** to remove the extension's own bookmarks without deleting unrelated browser bookmarks.

Bookmarks use the selected prompt color. Bookmark color is intended to stay fixed; the **tab favicon** changes to indicate ChatGPT state. If a bookmark looks wrong, use its refresh/update control and allow Chrome time to update its favicon cache.

Bookmark launchers use color-specific pages hosted under `rafaelrbravo.com` to help Chrome register their favicons and redirect into ChatGPT. The prompt text itself remains in local extension storage rather than being placed in the hosted URL.

### Read tab indicators

- **Colored icon:** Tab is associated with a saved prompt and uses its selected hue.
- **Faded icon:** ChatGPT appears to be working.
- **Full-color icon:** ChatGPT appears to have stopped or is awaiting attention.
- **Circle:** Chat mode.
- **Square:** Work mode.
- **Unassociated tabs:** Use a neutral indicator rather than a saved prompt's hue.

These states are inferred from ChatGPT's web interface. They are convenience signals, not authoritative proof that a request succeeded or a response is complete.

## Auto-Continue: long-running assignments

Auto-Continue repeatedly sends a configurable follow-up message **after a completed assistant response**. It is useful for multi-stage research, coding, test/fix cycles, and systematic reviews where the assistant should evaluate progress and continue.

### Start a loop

1. Give ChatGPT a substantial initial assignment, including its goal, constraints, and completion criteria.
2. Open Auto-Continue using the **repeat-style button beside the composer + button**.
3. Review the **Continuation prompt**, **Cycles**, **Timeout (minutes)**, **Rollover every N cycles**, and **Stop string** fields.
4. Click **Run**. Opening the settings panel alone does not start a loop.
5. Watch the progress and status text. Click **Cancel loop** to stop manually.

A useful continuation prompt is:

> Continue working toward the original assignment. Review progress and remaining tasks, and make substantive progress before stopping. When the assignment is genuinely complete, output AUTOCONTINUE_COMPLETE on its own line.

### Understand each setting

| Setting | Behavior |
| --- | --- |
| Continuation prompt | The message sent on each subsequent cycle |
| Cycles | Maximum cumulative continuation messages; **0 or a negative integer means unlimited** |
| Timeout (minutes) | Maximum overall elapsed time; **0 or a negative value means unlimited** |
| Rollover every N cycles | Open a successor conversation after every N completed cycles; **0 or negative disables rollover** |
| Stop string | A marker that stops the loop when emitted as a standalone line in a completed assistant reply |
| Run | Start the loop using the current settings |
| Cancel loop | End the active loop manually |

The extension persists the entered settings. Unlimited settings remove the corresponding limit; they do **not** bypass ChatGPT account quotas or guarantee indefinite operation.

**Recommended first experiment:** Use 3–5 cycles and a short timeout with a harmless task. Confirm the continuation messages submit correctly and that the stop marker works before attempting long unattended runs.

### Completion markers

The default marker is `AUTOCONTINUE_COMPLETE`. Tell ChatGPT to output that exact string **on a line by itself only when the assignment is finished**. Avoid placing the marker as a standalone line in ordinary intermediate responses, because it may terminate the loop prematurely.

If the task is open-ended, use a cycle or timeout limit instead of relying solely on the model to declare completion.

### Important operating constraints

Auto-Continue depends on the browser tab and ChatGPT's current page structure. It can fail when ChatGPT changes its composer, response markup, or submission controls; when a tab is closed or navigated away; or when a rate/usage limit interrupts work. The extension's loop is not an independent scheduled background job. Review outputs, especially before allowing consequential file writes, external actions, or expensive operations.

## Automatic conversation rollover

Rollover is designed to reduce the burden of very long ChatGPT conversations. After a specified number of completed continuation cycles, the extension can open a **new conversation**, relaunch the **same saved Prompt Launcher prompt**, and resume Auto-Continue.

### Prerequisites

- Start from a tab associated with a **saved Prompt Launcher prompt** (ideally your fully qualified ContextLoop loading prompt).
- Ensure that prompt reliably loads the canonical GitHub context.
- Make sure the assistant saves and verifies important progress before rollover.
- Set a **positive** value for **Rollover every N cycles**.

Rollover is not merely a visual tab switch: the new conversation must reconstruct its working state from the saved context and the relaunch prompt. **Anything not successfully checkpointed may be lost.**

### What the handoff attempts to preserve

The v91 implementation carries forward the original loop start time, cumulative completed cycles, configured limits, continuation message, stop string, and saved prompt identity. It opens a successor tab, waits for the relaunched prompt to produce a completed response, and then resumes continuation. The predecessor is intended to close only after the successor confirms the loop resumed; if handoff fails, the predecessor may remain available for recovery.

The new tab's **conversation history is not copied**. The canonical GitHub file is what makes continuity possible.

### Choosing an interval

There is no established universal ChatGPT conversation-length threshold. A practical starting point is **30 cycles**; **40–50** may be preferable if frequent new-chat creation causes failures. Test with a small interval first, then adjust based on actual browser behavior.

A good assignment instruction is:

> Work systematically, maintain an accurate completed/remaining checklist in the active GitHub context, and verify the checkpoint before any conversation rollover. Do not repeat already completed work. Output AUTOCONTINUE_COMPLETE only when all completion criteria are met.

**Rollover does not circumvent model usage limits.** New-chat creation itself can fail or encounter throttling. It is best treated as a recovery/organization feature, not a guarantee of unlimited work.

## Recommended workflows

### Research or literature review

Keep a context with scope, search strategy, verified sources, conclusions, rejected leads, and open questions. Ask ChatGPT to search systematically, record coverage, and continue from the next unreviewed item. Use Auto-Continue with finite limits. Preserve citations and distinguish verified findings from leads requiring confirmation.

### Software development

Track repository, architecture, coding conventions, tests run, known failures, and next steps. Ask ChatGPT to implement and test one meaningful increment per cycle, update the checkpoint, and avoid repeating solved bugs. Review diffs and tests; do not interpret repeated assistant messages as proof that code was validated.

### Career or opportunity discovery

Track geographic constraints, organizations reviewed, postings identified, exclusions, and remaining coverage. Ask for exhaustive, systematic exploration rather than revisiting the same leads. Use the context to record what was checked and when; verify live postings separately.

### Writing and long documents

Store target audience, outline, style constraints, completed sections, outstanding revisions, and source verification status. Continue one section or verification pass at a time. Preserve important source corrections so they are not reintroduced in later conversations.

### Managing several projects

Give each project its own context file and Prompt Launcher button/color. Use a separate cross-project synthesis conversation when needed rather than merging unrelated project histories.

## Troubleshooting and recovery

| Symptom | What to check |
| --- | --- |
| GitHub context does not load | Confirm the repository name, filename, GitHub connection, and permissions; request an explicit fetch |
| GitHub update fails | Refetch the latest file and SHA; retry sequentially; retain unsaved changes and report them |
| Extension does not load | Extract the ZIP and select the folder with `manifest.json`; check `chrome://extensions` errors |
| Sidebar buttons missing | Reload ChatGPT, verify extension enabled, and check that prompts were saved |
| Bookmark shows wrong icon | Refresh/update that bookmark; allow favicon caching; verify the saved prompt exists |
| Prompt does not submit | Check the current ChatGPT page, enabled composer, and whether the extension's selectors still match |
| Auto-Continue appears stuck | Check whether ChatGPT is still generating, a response has actually completed, or an error/survey has altered the page |
| "Send unavailable" | The extension may not recognize an otherwise enabled Send button; avoid duplicate manual/automatic submissions |
| "Too many requests" or "You've hit your limit" | Stop or pause automation, preserve progress, and retry later; these errors do not establish a specific quota |
| Rollover fails | Check that the originating tab has a saved prompt identity and that its canonical context checkpoint was verified |
| Prompt transfer breaks bookmarks | Recreate/refresh bookmarks after pasting prompts; bookmark IDs are not transferred |
| Multiple icons or strange tab behavior | Disable duplicate Prompt Launcher installations |

**When diagnosing a failure**, capture the extension version, exact error text, current tab state, whether ChatGPT's native Stop/Send control is visible, and the last verified GitHub checkpoint. Do not assume that a stalled loop means the assistant made no progress, or that a visible completed answer means the extension successfully detected completion.

## Security, privacy, and limitations

- **You control the canonical data:** Your GitHub repository stores the plain-text contexts. Git commit history provides versioning and rollback.
- **Private does not mean secret-proof:** Connected tools and anyone with repository access can potentially read its contents. Avoid credentials, access tokens, sensitive personal data, and unnecessary confidential information.
- **GitHub access matters:** A read-only connection can load context but cannot persist updates. Check permissions before relying on continuity.
- **Prompt Launcher stores prompt definitions locally:** Copy/paste transfer moves definitions between installations; it does not synchronize your GitHub contexts.
- **Bookmark redirects use a hosted domain:** The extension's bookmark color mechanism relies on `rafaelrbravo.com`; review that behavior if it affects your privacy requirements.
- **The extension interacts with ChatGPT's interface:** Website changes, focus behavior, Chrome throttling, browser restarts, or account limits can interrupt automation.
- **Context instructions are not guarantees:** ChatGPT can omit details, misunderstand state, fail tool calls, or make imperfect summaries. Inspect important changes and verify important facts independently.
- **Rollover is not a backup:** Only the last successfully verified GitHub state is reliably available to a fresh conversation.
- **No external service is required for context persistence beyond GitHub and ChatGPT:** The extension is optional browser convenience software; it does not replace GitHub as the context store.

## Project files and versions

- [startercontext.txt](startercontext.txt) — copyable starting context with the global directive.
- [ChatGPT-Prompt-Launcher-v91.zip](ChatGPT-Prompt-Launcher-v91.zip) — current Chrome extension archive (manifest version `0.19.40`).
- [LICENSE](LICENSE) — Apache License 2.0.

The instructions here describe the published v91 package. Some advanced behaviors are inherently dependent on ChatGPT's current website and should be tested in your browser before trusting unattended workflows.

## License

ContextLoop is licensed under the **Apache License, Version 2.0**. See [LICENSE](LICENSE).
