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

## Optional: ChatGPT Prompt Launcher Chrome extension

**ChatGPT Prompt Launcher** is an optional Chrome extension for quickly launching saved prompts in ChatGPT. It works with ContextLoop catalyst prompts, but it can also launch any other frequently used ChatGPT prompt.

**ContextLoop works without the extension.** The extension does not read, store, or synchronize your GitHub context files; it simply launches the prompts you configure.

### Install in Chrome

1. Download [ChatGPT-Prompt-Launcher-v46.zip](ChatGPT-Prompt-Launcher-v46.zip) and extract it to a permanent folder on your computer.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the **extracted folder containing `manifest.json`** (not the ZIP).
5. Open or reload [ChatGPT](https://chatgpt.com). Prompt buttons appear at the top of the left sidebar.

Keep the extracted folder in place: Chrome loads the unpacked extension from that folder. This release is labeled **v46** in its archive filename; the Chrome extension manifest reports version **0.18.1**.

### Configure your prompts

Click the extension's toolbar icon to open **ChatGPT Prompt Launcher** settings.

1. Click **Add prompt button**.
2. Give the entry a short name, such as **Research** or **Career**.
3. Paste the full context-loading prompt from the Quick start section, changing the repository and filename to match your context.
4. Choose a color using the hue slider. Changes are saved in the extension's local browser storage.
5. Repeat for additional contexts. Drag entries by their handles to reorder them.

You can also save general-purpose prompts that have nothing to do with ContextLoop.

### Launch prompts

- **Normal click:** Launch and automatically submit the saved prompt in the current ChatGPT tab.
- **Ctrl-click or middle-click:** Use the browser's native new-tab behavior to launch the prompt in another tab.
- **Bookmark launcher:** In settings, click **Add bookmark** for a prompt. Its bookmark is added at the far left of the bookmarks bar, with the prompt's chosen color. Rename or recolor the prompt to update its associated bookmark. You can also remove individual bookmarks or use **Delete all bookmarks** to remove Prompt Launcher bookmarks.

The bookmark launcher uses a URL hosted at `rafaelrbravo.com` to open the associated prompt. The extension requires Chrome permissions for local storage, bookmarks, and tabs, plus access to ChatGPT pages.

### Tab colors and status indicators

ChatGPT Prompt Launcher also makes it easier to recognize ChatGPT tabs:

- **Prompt color:** Tabs launched through a saved prompt use that prompt's selected hue.
- **Working versus ready:** The favicon is faded while ChatGPT is working and returns to full color when it stops or is awaiting attention.
- **Chat versus Work:** A **circle** represents Chat mode; a **square** represents Work mode.
- **Unassociated tabs:** ChatGPT tabs not associated with a saved prompt use a black icon with a white border, with the fill fading while working.

These indicators are inferred from ChatGPT's interface, so changes to the website may affect their reliability.

### Troubleshooting

If the buttons do not appear, reload ChatGPT after installing the extension and confirm it is enabled at `chrome://extensions`. If Chrome cannot load the extension, make sure you selected the extracted folder containing `manifest.json`. If a bookmark launcher stops working, check that the extension is installed and that its corresponding prompt still exists.

This is an unpacked Chrome extension, not a Chrome Web Store installation. Review the permissions and source files before installing software you download from GitHub.

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
