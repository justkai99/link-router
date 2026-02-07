const fallbackMessages = {
  extensionName: "Link Router",
  extensionDescription:
    "Automatically route links to Normal or Incognito windows via regex and instantly toggle modes.",
  commandOpenPanelDescription: "Open extension panel",
  optionsPageTitle: "Link Router",

  ignorePriorityNotice: "Ignore rules always override all other rules, regardless of order.",
  ignoreRuleCountOne: "$1 ignore rule",
  ignoreRuleCountOther: "$1 ignore rules",

  searchPlaceholder: "Search by RegExp or description",
  searchAriaLabel: "Search rules",
  importJson: "Import JSON",
  exportJson: "Export JSON",
  create: "Create",

  filters: "Filters",
  openIn: "Open In",
  status: "Status",
  all: "All",
  normal: "Normal",
  incognito: "Incognito",
  ignore: "Ignore",
  enabled: "Enabled",
  disabled: "Disabled",
  rulesSummary: "$1 rules · $2 disabled",

  tableIndex: "#",
  regexp: "RegExp",
  description: "Description",
  createdAt: "Created At",
  updatedAt: "Updated At",
  operations: "Operations",
  highestPriority: "Highest Priority",

  shadowingWarning: "May never take effect because of Ignore rule: $1",
  moveRuleUpAria: "Move rule up",
  moveRuleDownAria: "Move rule down",
  moveUp: "Up",
  moveDown: "Down",
  ignoreOrderingHint:
    "Ignore rules always override non-ignore rules; order only matters among Ignore rules.",

  editRuleAria: "Edit rule",
  edit: "Edit",
  moreActionsAria: "More actions",
  moreActions: "More actions",
  duplicate: "Duplicate",
  moveToTop: "Move to top",
  moveToBottom: "Move to bottom",
  delete: "Delete",

  noRulesYet: "No rules yet.",
  example: "Example:",
  createFirstRule: "Create your first rule",
  noMatchingRules: "No matching rules.",
  clearFilters: "Clear filters",

  deleteRuleTitle: "Delete Rule",
  deleteRuleDescription:
    "This action cannot be undone. The selected rule will be permanently removed.",
  cancel: "Cancel",
  save: "Save",

  createRuleTitle: "Create Rule",
  editRuleTitle: "Edit Rule",
  inputPlaceholder: "Please input",
  descriptionPlaceholder: "e.g. Work sites",
  regexpHelp: "Use a valid JavaScript RegExp (e.g. ^https://mail.google.com).",
  ignoreDoNothing: "Ignore (Do nothing)",
  ignorePriorityHelp:
    "Ignore has global priority and will prevent routing when matched.",

  testUrlOptional: "Test URL (optional)",
  testUrlPlaceholder: "https://example.com/path",
  testUrlHint: "Try an example URL to verify the pattern.",
  testUrlMatch: "Matches the pattern.",
  testUrlNoMatch: "Does not match the pattern.",

  regexpRequired: "RegExp is required",
  regexpInvalid: "Invalid RegExp pattern",
  descriptionRequired: "Description is required",
  descriptionTooLong: "Description is too long",

  importInvalidFormat: "Invalid JSON format. Expect RuleItem[] or { rules: RuleItem[] }.",
  importNoValidRules: "No valid rules found in file.",
  importReplaceConfirm: "Import will replace current $1 rules. Continue?",
  importFailed: "Failed to import rules. Please check JSON format.",

  notAvailable: "-",
} as const;

export type MessageKey = keyof typeof fallbackMessages;
type Substitutions = string | number | Array<string | number>;

function normalizeSubstitutions(
  substitutions?: Substitutions,
): string[] | undefined {
  if (substitutions === undefined) return undefined;
  if (Array.isArray(substitutions)) {
    return substitutions.map((item) => String(item));
  }
  return [String(substitutions)];
}

function applyFallbackSubstitutions(
  template: string,
  substitutions?: string[],
): string {
  if (!substitutions || substitutions.length === 0) return template;
  return template.replace(/\$(\d+)/g, (_, index: string) => {
    const value = substitutions[Number(index) - 1];
    return value ?? "";
  });
}

function getBrowserMessage(
  key: MessageKey,
  substitutions?: string[],
): string | null {
  if (typeof browser === "undefined" || !browser.i18n) return null;
  try {
    const result = browser.i18n.getMessage(
      key as never,
      substitutions as string[] | undefined,
    );
    return result || null;
  } catch {
    return null;
  }
}

export function t(key: MessageKey, substitutions?: Substitutions): string {
  const normalizedSubstitutions = normalizeSubstitutions(substitutions);
  const browserMessage = getBrowserMessage(key, normalizedSubstitutions);
  if (browserMessage) return browserMessage;
  return applyFallbackSubstitutions(
    fallbackMessages[key],
    normalizedSubstitutions,
  );
}

export function getUiLocale(): string {
  if (typeof browser !== "undefined" && browser.i18n) {
    const locale = browser.i18n.getMessage("@@ui_locale");
    if (locale) return locale;
  }
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language;
  }
  return "en";
}

export function setDocumentLocaleAttributes(): void {
  if (typeof document === "undefined") return;

  const locale = getUiLocale().replace("_", "-");
  document.documentElement.lang = locale;

  const direction =
    typeof browser !== "undefined"
      ? browser.i18n.getMessage("@@bidi_dir") || "ltr"
      : "ltr";
  document.documentElement.dir = direction;
}
