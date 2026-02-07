# Link Router

Link Router is a browser extension that automatically determines whether a link should open in a Normal tab or an Incognito window based on your custom rules, eliminating the need to manually copy and paste URLs.

## ✨ Core Features

- Smart Routing (Regex Support)
  Define rules with Regular Expressions to route links to `Normal` or `Incognito`.

- Ignore Rules With Global Highest Priority
  `Ignore` rules always override all other rules when matched, regardless of list order.

- Rule Management UI
  Search, filter, quick edit, reorder, duplicate, enable/disable inline, and delete with confirmation.

- JSON Import / Export
  Export all rules to a JSON file, and import rules by replace or merge.

- Merge Import With Deduplication
  Merge import deduplicates by `openIn + regexp`. Existing matched rules are updated; unmatched rules are added.

- Instant Mode Toggle
  Reopen the current tab in the opposite mode (`Normal` ⇋ `Incognito`) by clicking the extension icon or using a keyboard shortcut.

## ⚙️ Key Settings & Usage

1. Enable Incognito Access (Required)
   After installation, open `chrome://extensions`, find Link Router, and enable `Allow in Incognito`.

2. Configure Rules
   Right-click the extension icon and open `Options`.

   - `Open In`: `Normal` / `Incognito` / `Ignore`
   - Priority model:
     - `Ignore` has global highest priority.
     - For non-Ignore rules, order still matters (top-to-bottom).

3. Import / Export Rules (JSON)
   Use the buttons in Options:
   - `Export JSON`: download all current rules.
   - `Replace Import`: replace all current rules with imported file content.
   - `Merge Import`: merge imported rules into current rules with dedup by `openIn + regexp`.

4. Recommended Shortcut
   For quick toggling, you can set a shortcut such as `Alt + 2` (Windows) or `Option + 2` (macOS).
