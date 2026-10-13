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

The directive asks ChatGPT to:

1. **Read** the canonical GitHub file and its current blob SHA.
2. **Complete the user's task** and identify decisions, progress, useful hypotheses, and unresolved work.
3. **Reconcile and integrate** that information into the existing context rather than append chat transcripts.
4. **Write** using the current SHA to avoid blind overwrites.
5. **Verify** the update by refetching the file.
6. **Report** whether the context was read, updated, unchanged, or blocked.

The task comes first; context maintenance records its useful results. The global directive should change only when explicitly requested. It is a **prompt-level convention**, not an access-control mechanism.

### What belongs in a context?

Keep objectives, constraints, relevant preferences, decisions and rationale, completed work, rejected approaches, open tasks, failures, and recovery instructions. Summarize repetitive discussion; distinguish confirmed results from hypotheses and tentative plans.

For larger projects, use sections such as **Goal**, **Constraints**, **Current state**, **Completed**, **Open questions**, **Next steps**, and **Lessons learned**. Git history preserves older versions while the current file stays focused.

### Failure recovery

An attempted GitHub write is not a completed update. On failure, retain the intended changes in the conversation, refetch the latest file and SHA, retry safely, and report anything still unsaved. Reconcile any pending changes from the previous context-status note before declaring the next turn complete.

## Working with multiple contexts

Keep separate files for distinct projects—for example, `career.txt` for opportunities and rejected options, and `software.txt` for APIs, tests, and bugs.

- **Switch:** "Load `software.txt` from `your-username/my-contexts` and make it active."
- **Consult without switching:** "Read `career.txt` for relevant constraints, but keep `research.txt` active."
- **Compare:** "Compare the decisions in these two contexts; don't merge their files."
- **Consolidate:** "Remove duplication and obsolete statements from the active local context, preserving important history and unresolved work."

Aliases such as "load career" are useful after establishing the repository and file mapping. In a new conversation, specify the repository and filename.

## Install Prompt Launcher v91

**Published package:** [ChatGPT-Prompt-Launcher-v91.zip](ChatGPT-Prompt-Launcher-v91.zip) (manifest version **0.19.40**).

Install it as an **unpacked Chrome extension**; it is not distributed through the Chrome Web Store:

1. Download the ZIP and extract it to a permanent folder.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Select **Load unpacked**, then choose the folder with `manifest.json` at its top level—not the ZIP or its parent folder.
4. Open or reload [ChatGPT](https://chatgpt.com).
5. Click the extension's toolbar icon to open Settings. Saved prompt buttons appear near the top of ChatGPT's left sidebar.

Keep the extracted folder in place; Chrome loads the extension from it. The extension requests `storage`, `bookmarks`, and `tabs` permissions and access to `chatgpt.com` and `www.chatgpt.com`. Review its source before installing. Avoid enabling multiple copies, which can interfere with tab indicators and automation.

## Save, launch, and transfer prompts

### Create a saved context launcher

Open Settings from the toolbar icon:

1. Click **Add prompt button**.
2. Give it a name, such as "Research".
3. Paste the **full loading prompt**, including repository and filename.
4. Select a color with the hue slider.
5. Repeat for other contexts or reusable prompts.

The name is only a label; the prompt text is what ChatGPT receives. You can also save non-context prompts, such as code review or writing instructions. Drag the handles in Settings to reorder prompts; Chrome bookmarks do not move with them.

### Launch behavior

- **Click:** Send the saved prompt in the current ChatGPT tab.
- **Ctrl-click or middle-click:** Open it in a new tab using Chrome's native behavior.
- **Bookmark:** Launch the associated prompt from its colored bookmark.

The extension submits prompts but does not read or synchronize GitHub. ChatGPT uses its connected GitHub tools to do that work.

### Copy and paste prompts between installations

Use **Copy prompts** and **Paste prompts** in Settings to transfer configurations between compatible installations. The transfer preserves **names, prompt text, colors, and order**, but not bookmarks.

After confirmation, pasting **replaces** the destination prompts and assigns new IDs. Existing bookmark associations may break; inspect the imported prompts and recreate their bookmarks. This transfers extension configuration, not GitHub context files.

## Colored bookmarks and tab indicators

### Create and maintain bookmark launchers

In Settings, select **Add bookmark** for a saved prompt with nonempty text. The extension places it at the far left of Chrome's bookmarks bar. You can refresh or delete individual bookmarks, or use **Delete all bookmarks** to remove extension-created bookmarks without affecting unrelated ones.

Bookmark colors stay fixed; the **tab favicon** changes with ChatGPT's inferred state. If a bookmark's appearance is wrong, refresh it and allow Chrome's favicon cache to update.

The launchers use color-specific pages at `rafaelrbravo.com` to register favicons and redirect to ChatGPT. Prompt text stays in local extension storage, not in the hosted URL.

### Read tab indicators

- **Colored:** Associated with a saved prompt; uses its selected hue.
- **Faded:** ChatGPT appears to be working.
- **Full color:** ChatGPT appears stopped or awaiting attention.
- **Circle:** Chat mode.
- **Square:** Work mode.
- **Neutral:** Tab is not associated with a saved prompt.

Indicators are inferred from the ChatGPT web interface, not proof that a request succeeded or a response finished.

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
