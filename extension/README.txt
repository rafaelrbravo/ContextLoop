Prompt Launcher v86 — automatic predecessor tab cleanup

Based on v85. A successor tab acknowledges successful Auto-Continue restoration to the background service worker, which then closes only the tab that initiated that handoff. If context loading or session restoration fails, the predecessor stays open. The v85 selected-tab behavior and numeric limits remain unchanged.

v87: Create rollover successor inactive first; select it only if predecessor remains selected, without requesting Chrome window focus.
