<script setup lang="ts">
import { Plus, Search, Filter, Download, Upload } from "lucide-vue-next";
import { DialogType, OpenIn, RuleItem } from "@/lib/types";
import CreateAndEditDialog from "./components/CreateAndEditDialog.vue";
import Button from "@/components/ui/button/Button.vue";
import RulesTable from "./components/RulesTable.vue";
import { Input } from "@/components/ui/input";
import { uuid } from "@/lib/utils";
import { t } from "@/lib/i18n";

const rules = ref<RuleItem[]>([]);
const importInputRef = ref<HTMLInputElement | null>(null);

const open = ref(false);
const searchQuery = ref("");
const openInFilter = ref<OpenIn | "all">("all");
const enabledFilter = ref<"all" | "enabled" | "disabled">("all");

const totalCount = computed(() => rules.value.length);
const ignoreCount = computed(
  () => rules.value.filter((rule) => rule.openIn === OpenIn.Ignore).length,
);
const disabledCount = computed(
  () => rules.value.filter((rule) => !rule.enabled).length,
);
const ignoreCountLabel = computed(() =>
  ignoreCount.value === 1
    ? t("ignoreRuleCountOne", ignoreCount.value)
    : t("ignoreRuleCountOther", ignoreCount.value),
);
const rulesSummaryLabel = computed(() =>
  t("rulesSummary", [totalCount.value, disabledCount.value]),
);

const filteredRules = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  return rules.value.filter((rule) => {
    const matchesQuery =
      !query ||
      rule.regexp?.toLowerCase().includes(query) ||
      rule.description?.toLowerCase().includes(query);
    const matchesOpenIn =
      openInFilter.value === "all" || rule.openIn === openInFilter.value;
    const matchesEnabled =
      enabledFilter.value === "all" ||
      (enabledFilter.value === "enabled" ? rule.enabled : !rule.enabled);
    return matchesQuery && matchesOpenIn && matchesEnabled;
  });
});

const clearFilters = () => {
  searchQuery.value = "";
  openInFilter.value = "all";
  enabledFilter.value = "all";
};

const exportRules = () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    rules: rules.value,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `link-router-rules-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
};

const openImportFilePicker = () => {
  importInputRef.value?.click();
};

const normalizeImportedRule = (item: unknown): RuleItem | null => {
  if (!item || typeof item !== "object") return null;
  const rule = item as Record<string, unknown>;
  if (typeof rule.regexp !== "string" || rule.regexp.trim() === "") return null;
  if (
    typeof rule.description !== "string" ||
    rule.description.trim() === ""
  ) {
    return null;
  }
  if (
    rule.openIn !== OpenIn.Normal &&
    rule.openIn !== OpenIn.Incognito &&
    rule.openIn !== OpenIn.Ignore
  ) {
    return null;
  }
  return {
    id: uuid(),
    regexp: rule.regexp,
    description: rule.description,
    openIn: rule.openIn,
    enabled: typeof rule.enabled === "boolean" ? rule.enabled : true,
    createdAt:
      typeof rule.createdAt === "string"
        ? rule.createdAt
        : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const handleImportFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  try {
    const content = await file.text();
    const parsed = JSON.parse(content);
    const rawRules = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.rules)
        ? parsed.rules
        : null;
    if (!rawRules) {
      alert(t("importInvalidFormat"));
      return;
    }

    const normalizedRules = (rawRules as unknown[])
      .map((item) => normalizeImportedRule(item))
      .filter((item): item is RuleItem => item !== null);

    if (normalizedRules.length === 0) {
      alert(t("importNoValidRules"));
      return;
    }

    if (
      rules.value.length > 0 &&
      !window.confirm(t("importReplaceConfirm", rules.value.length))
    ) {
      return;
    }

    rules.value = normalizedRules;
    await storage.setItem("local:rules", JSON.stringify(normalizedRules));
  } catch (error) {
    console.error("Failed to import rules:", error);
    alert(t("importFailed"));
  } finally {
    input.value = "";
  }
};

onMounted(async () => {
  try {
    const rulesJson: any = await storage.getItem("local:rules");
    rules.value = JSON.parse(rulesJson) || [];
  } catch (error) {
    console.error("Failed to load rules from storage:", error);
    rules.value = [];
  }
});
</script>

<template>
  <div class="options-shell">
    <div class="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
      {{ t("ignorePriorityNotice") }}
      <span class="ml-2 font-medium">
        {{ ignoreCountLabel }}
      </span>
    </div>
    <div class="mb-4 flex flex-col gap-3 options-panel p-3">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[220px]">
          <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal-600" />
          <Input
            v-model="searchQuery"
            class="pl-9"
            :placeholder="t('searchPlaceholder')"
            :aria-label="t('searchAriaLabel')"
          />
        </div>
        <input
          ref="importInputRef"
          type="file"
          accept="application/json,.json"
          class="hidden"
          @change="handleImportFile"
        />
        <Button variant="outline" @click="openImportFilePicker">
          <Upload />
          {{ t("importJson") }}
        </Button>
        <Button variant="outline" @click="exportRules">
          <Download />
          {{ t("exportJson") }}
        </Button>
        <Button @click="open = true">
          <Plus />
          {{ t("create") }}
        </Button>
      </div>
      <div class="flex flex-wrap items-center gap-3 text-sm">
        <div class="flex items-center gap-2 text-teal-700">
          <Filter class="size-4" />
          <span>{{ t("filters") }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <span class="mr-1 text-xs font-medium text-slate-500">{{ t("openIn") }}</span>
          <Button
            size="sm"
            :variant="openInFilter === 'all' ? 'secondary' : 'outline'"
            :aria-pressed="openInFilter === 'all'"
            @click="openInFilter = 'all'"
          >
            {{ t("all") }}
          </Button>
          <Button
            size="sm"
            :variant="openInFilter === OpenIn.Normal ? 'secondary' : 'outline'"
            :aria-pressed="openInFilter === OpenIn.Normal"
            @click="openInFilter = OpenIn.Normal"
          >
            {{ t("normal") }}
          </Button>
          <Button
            size="sm"
            :variant="openInFilter === OpenIn.Incognito ? 'secondary' : 'outline'"
            :aria-pressed="openInFilter === OpenIn.Incognito"
            @click="openInFilter = OpenIn.Incognito"
          >
            {{ t("incognito") }}
          </Button>
          <Button
            size="sm"
            :variant="openInFilter === OpenIn.Ignore ? 'secondary' : 'outline'"
            :aria-pressed="openInFilter === OpenIn.Ignore"
            @click="openInFilter = OpenIn.Ignore"
          >
            {{ t("ignore") }}
          </Button>
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <span class="mr-1 text-xs font-medium text-slate-500">{{ t("status") }}</span>
          <Button
            size="sm"
            :variant="enabledFilter === 'all' ? 'secondary' : 'outline'"
            :aria-pressed="enabledFilter === 'all'"
            @click="enabledFilter = 'all'"
          >
            {{ t("all") }}
          </Button>
          <Button
            size="sm"
            :variant="enabledFilter === 'enabled' ? 'secondary' : 'outline'"
            :aria-pressed="enabledFilter === 'enabled'"
            @click="enabledFilter = 'enabled'"
          >
            {{ t("enabled") }}
          </Button>
          <Button
            size="sm"
            :variant="enabledFilter === 'disabled' ? 'secondary' : 'outline'"
            :aria-pressed="enabledFilter === 'disabled'"
            @click="enabledFilter = 'disabled'"
          >
            {{ t("disabled") }}
          </Button>
        </div>
        <div class="options-muted-chip rounded-md px-2 py-1 text-sm md:ml-auto">
          {{ rulesSummaryLabel }}
        </div>
      </div>
    </div>
    <div class="options-panel p-2">
      <RulesTable
        :rules="filteredRules"
        :source-rules="rules"
        @create="open = true"
        @clear-filters="clearFilters"
      />
    </div>
  </div>
  <CreateAndEditDialog
    v-if="open"
    :type="DialogType.Create"
    :rules
    v-model:open="open"
  />
</template>
