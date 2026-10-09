# ContextLoop

**Persistent, user-controlled context for ChatGPT.**

ContextLoop maintains context across ChatGPT conversations using plain-text files stored in GitHub. Each project has a persistent context file that ChatGPT reads, maintains, and updates as you work.

**No additional software installation is required.** You need ChatGPT with access to a connected GitHub repository. A Chrome extension is an optional convenience.

## Quick start

### 1. Create a GitHub repository

Create a public or private repository for your context files. Connect GitHub to ChatGPT and authorize access to read and update the repository.

### 2. Add a context file

Copy [startercontext.txt](startercontext.txt) into your repository and rename it for your project, for example `research.txt`.

Each file contains a **global directive** governing context maintenance and a **local context** holding project-specific decisions, findings, preferences, progress, and open questions. You can keep multiple context files together in the repository root.

### 3. Start a conversation

Open a new ChatGPT conversation and paste this prompt, substituting your repository and filename:

> Load and read `research.txt` from my GitHub repository `your-username/your-repository` and use it as the active project context for this conversation. Follow the directive in that file, and treat that GitHub file as the canonical location for all future context updates.

ChatGPT should read the file and confirm that it has been loaded.

### 4. Work normally

Continue talking to ChatGPT as usual. The directive instructs it to read the current context, preserve useful new information, save updates to GitHub, and verify writes. You should not need to explicitly ask it to remember things or save progress.

Each substantive response should include a brief context-status report.

### 5. Resume later

Start another conversation with the same loading prompt to retrieve the latest saved context.

## Everyday usage

Once ChatGPT is familiar with your setup, shorter instructions often work:

- **"Load meta."** Load a familiar context by shorthand.
- **"Switch to your career context."** Change the active context.
- **"Update your context with this decision."** Explicitly preserve information.
- **"Check your context for what we decided earlier."** Consult the canonical file.
- **"Read your software context too."** Use information from another project.

You can refer to the active file as **"your context"** and ask ChatGPT to reorganize, consolidate, correct, or remove information in its local context.

These shortcuts depend on ChatGPT having enough information to identify the intended repository and file. In a fresh conversation, the full loading prompt is more reliable.

### Protected global directive

ChatGPT is instructed **not to modify the global directive** during routine context maintenance. It should only change the directive when you explicitly request that change. This protection is instructional, not a technical access restriction.

### Multiple contexts

While one context is active, ChatGPT can read another to combine information across projects. Reading another context does not automatically make it active or authorize modifying it; the current context remains active until you switch.

## How ContextLoop works

1. **Read:** Fetch the latest canonical GitHub context.
2. **Work:** Answer questions or carry out tasks.
3. **Reconcile:** Identify new information worth preserving.
4. **Save:** Integrate it into the context file.
5. **Verify:** Refetch to confirm the update.
6. **Report:** Briefly describe context status.

The global directive governs this cycle; the local context stores project knowledge. GitHub provides persistent storage, version history, and direct file access.

## Optional: Prompt Launcher Chrome extension

If you regularly switch between contexts, the optional **Prompt Launcher** Chrome extension can launch reusable context-loading prompts for projects such as research, software, or career planning.

The extension does not store or synchronize context. GitHub remains the canonical source. **You do not need the extension to use ContextLoop.**

## Design principles

**User ownership:** Files remain under your control.

**Continuity:** Resume work across independent conversations.

**Automatic maintenance:** Preserve useful information without explicit save commands.

**Transparency:** Inspect and edit human-readable text directly.

**Verification:** Check writes rather than assuming success.

**Protected instructions:** Leave the global directive unchanged unless explicitly asked.

**Cross-project flexibility:** Consult multiple contexts without merging them.

**Simplicity:** No separate database, server, or background service.

## Limitations

ContextLoop relies on ChatGPT following instructions and having writable GitHub access; it is not a guaranteed synchronization service. Reads and writes may fail, information may be missed or imperfectly summarized, and failed updates may need to be retried. Information is reliably available in a new conversation only after a successful save.

Short loading commands may be ambiguous; specify the repository and filename when needed. Large files require more context to process. Avoid storing passwords, tokens, or secrets; use private repositories for nonpublic information.

## License

ContextLoop is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE).
