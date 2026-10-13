# ContextLoop

**Persistent project memory for ChatGPT, with optional prompt launching and automated continuation.**

ContextLoop uses **plain-text files in your GitHub repository** to carry project context between ChatGPT conversations. Ask ChatGPT to load a file containing instructions for maintaining that context. As you work, those instructions direct it to record useful decisions and progress, verify GitHub updates, and report failures. Resume in a new chat by loading the latest file. Persistence depends on successful GitHub access and writes; it is not guaranteed.

The optional **ChatGPT Prompt Launcher** Chrome extension provides one-click context loading, colored bookmarks, tab activity indicators, prompt import/export, **Auto-Continue**, and **conversation rollover**. You can use ContextLoop without the extension.

## Contents

- [What ContextLoop provides](#what-contextloop-provides)
- [Quick start: persistent context](#quick-start-persistent-context)
- [How ChatGPT maintains project context](#how-chatgpt-maintains-project-context)
- [Working with multiple contexts](#working-with-multiple-contexts)
- [Install Prompt Launcher v91](#install-prompt-launcher-v91)
- [Save, launch, and transfer prompts](#save-launch-and-transfer-prompts)
- [Colored bookmarks and tab indicators](#colored-bookmarks-and-tab-indicators)
- [Auto-Continue: long-running assignments](#auto-continue-long-running-assignments)
- [Automatic conversation rollover](#automatic-conversation-rollover)
- [Recommended workflows](#recommended-workflows)
- [Troubleshooting and recovery](#troubleshooting-and-recovery)
- [Security, privacy, and limitations](#security-privacy-and-limitations)

## What ContextLoop provides

ContextLoop's core workflow works through ChatGPT and a GitHub repository:

- **Persistent project context:** Carry decisions, findings, constraints, and unfinished work across conversations.
- **Context maintenance:** Have ChatGPT reconcile new information with the canonical GitHub file, verify saves by rereading it, and use Git history to recover earlier versions.
- **Multiple projects:** Keep separate context files for unrelated projects and explicitly switch between them.

The optional **ChatGPT Prompt Launcher** Chrome extension adds browser conveniences:

- **Prompt buttons and colored bookmarks:** Launch reusable prompts from the ChatGPT sidebar or a Chrome bookmark.
- **Tab indicators:** Recognize prompt-associated tabs and distinguish working from ready states.
- **Prompt transfer:** Copy and paste prompt definitions between extension installations.
- **Auto-Continue:** Send a continuation message after each completed response, with cycle limits, time limits, and an assistant completion marker.
- **Conversation rollover:** Start a successor chat after a configured number of cycles and resume the loop.

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

### 2. Create the context file—don't prefill the project history

Copy [startercontext.txt](startercontext.txt) into your repository and rename the copy, for example, `research.txt`. **You do not need to fill in the project-specific section yourself.** The starter provides the operating instructions; ChatGPT can build and maintain the project context as you explain your work and make progress.

Keep unrelated projects in separate files. **Never store passwords, tokens, or other secrets in context files.** Private repositories can hold nonpublic project details, but are not secrets managers.

### 3. Load it and introduce your project

Start a new ChatGPT conversation with a prompt like this, replacing the example repository and filename and briefly describing what you're trying to do:

> Load and read `research.txt` from my GitHub repository `your-username/my-contexts` and use it as the active project context. Follow its directive. This is a new context, so don't expect me to have prewritten the project details into the file. Help me develop the context from what I tell you and the work we do; preserve important goals, constraints, decisions, progress, and open questions as they emerge. My project is: [brief description of your project and what you want to accomplish].

You don't need to summarize everything up front. Give ChatGPT enough information to begin, then add details naturally as you work. It should read the file first and verify any updates it makes. Confirm that it actually fetched the file; if it could not, check the GitHub connection and repository permissions.

### 4. Work normally

Work normally: ask questions, research, write code, analyze documents, and make decisions. The directive instructs ChatGPT to preserve useful information. You can also request specific maintenance:

- "Record that decision in the active context."
- "Consolidate the context without losing unresolved issues."
- "Review the current context before answering."
- "Update the plan and preserve what remains unfinished."

ChatGPT should **refetch the file after saving** to verify the write. If it cannot save, it should identify the unsaved changes rather than claim success.

### 5. Resume in another conversation

Start a fresh chat with the same loading prompt. ChatGPT should fetch the **latest GitHub version**, not rely on the previous conversation. This is useful when a chat becomes long, slow, or difficult to navigate.

## How ChatGPT maintains project context

The directive asks ChatGPT to:

1. **Read** the canonical GitHub file and its current blob SHA (a unique identifier GitHub uses for that version of the file).
2. **Complete the user's task** and identify decisions, progress, useful hypotheses, and unresolved work.
3. **Reconcile and integrate** that information into the existing context rather than append chat transcripts.
4. **Write** using that identifier to avoid overwriting a newer version accidentally.
5. **Verify** the update by refetching the file.
6. **Report** whether the context was read, updated, unchanged, or blocked.

The task comes first; context maintenance records its useful results. The global directive should change only when explicitly requested. It is a **prompt-level convention**, not an access-control mechanism.

### What belongs in a context?

Think of the context as a concise project notebook, not a transcript of every conversation. As you work, ChatGPT can keep track of what you're trying to achieve, important constraints and preferences, decisions and why you made them, what you've completed or ruled out, what remains uncertain, and what to do next. It can also record failures and how to recover from them.

You don't need to plan the file's structure in advance. ChatGPT can organize the information into useful sections as the project grows, summarize repeated discussion, and distinguish confirmed results from possibilities or tentative plans. Git history lets you revisit older versions, so the current context can stay focused on what matters now.

### Failure recovery

An attempted GitHub write is not a completed update. On failure, retain the intended changes in the conversation, refetch the latest file and its identifier, retry safely, and report anything still unsaved. Reconcile any pending changes from the previous context-status note before declaring the next turn complete.

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

Auto-Continue sends a configurable follow-up **after each completed assistant response**. Use it for multi-stage research, coding, test/fix cycles, or reviews that require repeated progress checks.

### Start a loop

1. Give ChatGPT the assignment, constraints, and completion criteria.
2. Click the **repeat-style button beside the composer + button**.
3. Set the **Continuation prompt**, **Cycles**, **Timeout (minutes)**, **Rollover every N cycles**, and **Stop string**.
4. Click **Run**; opening the panel alone does not start the loop.
5. Monitor status and progress. Use **Cancel loop** to stop manually.

Example continuation prompt:

> Continue working toward the original assignment. Review progress and remaining tasks, and make substantive progress before stopping. When the assignment is genuinely complete, output AUTOCONTINUE_COMPLETE on its own line.

### Understand each setting

| Setting | Behavior |
| --- | --- |
| Continuation prompt | Message sent on each subsequent cycle |
| Cycles | Maximum cumulative continuation messages; **0 or negative means unlimited** |
| Timeout (minutes) | Overall elapsed-time limit; **0 or negative means unlimited** |
| Rollover every N cycles | Start a successor conversation after every N completed cycles; **0 or negative disables rollover** |
| Stop string | Stop when this marker appears alone on a line in a completed assistant reply |
| Run / Cancel loop | Start the configured loop / stop it manually |

Settings persist. Unlimited values remove those limits, **not** ChatGPT account quotas or other interruptions.

First test a harmless task with **3–5 cycles and a short timeout**. Check that continuation and stop detection work before leaving a long loop unattended.

### Completion markers

The default is `AUTOCONTINUE_COMPLETE`. Instruct ChatGPT to emit it **alone on a line, only after finishing**. A standalone marker in an intermediate reply may stop the loop early. For open-ended work, use cycle or timeout limits rather than relying only on self-declared completion.

### Important operating constraints

Auto-Continue depends on an open browser tab and ChatGPT's page structure. Changes to composer, response markup, or submit controls; navigation or tab closure; and rate or usage limits can interrupt it. It is **not a scheduled background job**. Review outputs before consequential file writes, external actions, or expensive operations.

## Automatic conversation rollover

After a configured number of completed cycles, rollover can open a **new chat**, relaunch the **same saved Prompt Launcher prompt**, and resume Auto-Continue. It helps manage long conversations; it does not transfer their history.

### Prerequisites

- Start in a tab associated with a **saved prompt**, preferably the full ContextLoop loading prompt.
- Confirm that prompt loads the canonical GitHub context.
- Save and verify important progress before rollover.
- Set **Rollover every N cycles** to a positive number.

The new chat reconstructs its state from the saved prompt and GitHub context. **Uncheckpointed work may be lost.**

### What the handoff attempts to preserve

The v91 handoff carries the original loop start time, cumulative completed cycles, limits, continuation prompt, stop string, and saved prompt identity. It opens a successor tab, waits for the relaunched prompt to finish, then resumes the loop. The predecessor should close only after the successor confirms resumption; if handoff fails, it may remain open for recovery.

**Conversation history is not copied.** Continuity depends on the canonical GitHub file.

### Choosing an interval

There is no universal ChatGPT conversation-length threshold. Try **30 cycles** initially; **40–50** may work better if frequent new chats cause problems. Test a small interval before committing to a long run.

Suggested assignment instruction:

> Work systematically, maintain an accurate completed/remaining checklist in the active GitHub context, and verify the checkpoint before any conversation rollover. Do not repeat already completed work. Output AUTOCONTINUE_COMPLETE only when all completion criteria are met.

Rollover **does not bypass usage limits**. New-chat creation can fail or be throttled, so treat it as an organizational and recovery aid, not a guarantee of unlimited work.

## Recommended workflows

### Research or literature review

Record scope, search strategy, verified sources, conclusions, rejected leads, and open questions. Search systematically, track coverage, and resume at the next unreviewed item. Use finite Auto-Continue limits, retain citations, and separate confirmed findings from unverified leads.

### Software development

Track the repository, architecture, conventions, tests run, failures, and next steps. Implement and test one meaningful increment per cycle, checkpoint progress, and avoid revisiting solved bugs. Review diffs and test results; repeated assistant replies do not prove validation.

### Career or opportunity discovery

Record geographic constraints, organizations and postings reviewed, exclusions, and remaining coverage. Explore systematically rather than recycle leads. Note what was checked and when, and verify live postings separately.

### Writing and long documents

Keep the audience, outline, style constraints, completed sections, pending revisions, and source-verification status. Work section by section or audit pass by audit pass, preserving corrections across conversations.

### Managing several projects

Use a separate context file and Prompt Launcher button/color for each project. Compare projects in a separate synthesis chat rather than merge unrelated histories.

## Troubleshooting and recovery

| Symptom | What to check |
| --- | --- |
| GitHub context will not load | Repository, filename, connection, permissions; request an explicit fetch |
| GitHub update fails | Refetch file and SHA, retry sequentially, retain and report unsaved changes |
| Extension will not load | Extract ZIP, select folder containing `manifest.json`, inspect `chrome://extensions` errors |
| Sidebar buttons missing | Reload ChatGPT, check extension enabled and prompts saved |
| Wrong bookmark icon | Refresh bookmark, allow favicon cache to update, confirm saved prompt exists |
| Prompt will not submit | ChatGPT page, enabled composer, and extension selectors |
| Auto-Continue stuck | Ongoing generation, incomplete response, or changed page due to error/survey |
| "Send unavailable" | Extension may miss an enabled Send button; avoid duplicate manual/automatic sends |
| "Too many requests" or "You've hit your limit" | Pause, save progress, retry later; message does not identify a specific quota |
| Rollover fails | Saved prompt identity on originating tab and verified canonical checkpoint |
| Bookmarks break after prompt transfer | Recreate/refresh bookmarks; IDs do not transfer |
| Multiple icons or unusual tab behavior | Disable duplicate extension installations |

For diagnosis, capture the extension version, exact error, tab state, visibility of ChatGPT's native Stop/Send control, and last verified GitHub checkpoint. A stalled loop may still have made progress; a completed-looking response may not have been detected by the extension.

## Security, privacy, and limitations

- **Canonical storage:** Plain-text contexts live in your GitHub repository; commit history supports rollback.
- **Privacy:** Repository access and connected tools may expose contents. Do not store credentials, tokens, sensitive personal information, or unnecessary confidential material—even in private repositories.
- **Permissions:** Read-only GitHub access can load context but cannot save updates.
- **Local prompt storage:** Prompt Launcher stores prompt definitions locally; copy/paste transfers definitions, not GitHub contexts.
- **Hosted bookmark redirects:** Color-specific bookmarks rely on `rafaelrbravo.com`; review this dependency for your privacy needs.
- **Browser dependence:** Interface changes, focus issues, Chrome throttling, restarts, and account limits can interrupt automation.
- **Fallible instructions:** ChatGPT may omit information, misunderstand state, fail tool calls, or summarize imperfectly. Review consequential changes and verify facts.
- **Rollover is not backup:** A new conversation can rely only on the last successfully verified GitHub checkpoint.
- **Optional extension:** Context persistence requires GitHub and ChatGPT, not an additional service. The extension is browser convenience software.

## Files included in this repository

- [startercontext.txt](startercontext.txt) — starter context with global directive.
- [ChatGPT-Prompt-Launcher-v91.zip](ChatGPT-Prompt-Launcher-v91.zip) — published Chrome extension (manifest `0.19.40`).
- [LICENSE](LICENSE) — Apache License 2.0.

This README describes v91. Test website-dependent features in your browser before relying on unattended automation.

## License

ContextLoop uses the **Apache License, Version 2.0**. See [LICENSE](LICENSE).
