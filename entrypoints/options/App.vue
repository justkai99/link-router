<script setup lang="ts">
import { Plus, Search, Filter, Download, Upload } from "lucide-vue-next";
import { DialogType, OpenIn, RuleItem } from "@/lib/types";
import CreateAndEditDialog from "./components/CreateAndEditDialog.vue";
import Button from "@/components/ui/button/Button.vue";
import RulesTable from "./components/RulesTable.vue";
import { Input } from "@/components/ui/input";
import { uuid } from "@/lib/utils";

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
  () => rules.value.filter((rule) => !rule.enabled).length
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
      alert("Invalid JSON format. Expect RuleItem[] or { rules: RuleItem[] }.");
      return;
    }

    const normalizedRules = (rawRules as unknown[])
      .map((item) => normalizeImportedRule(item))
      .filter((item): item is RuleItem => item !== null);

    if (normalizedRules.length === 0) {
      alert("No valid rules found in file.");
      return;
    }

    if (
      rules.value.length > 0 &&
      !window.confirm(
        `Import will replace current ${rules.value.length} rules. Continue?`,
      )
    ) {
      return;
    }

    rules.value = normalizedRules;
    await storage.setItem("local:rules", JSON.stringify(normalizedRules));
  } catch (error) {
    console.error("Failed to import rules:", error);
    alert("Failed to import rules. Please check JSON format.");
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
      Ignore rules always override all other rules, regardless of order.
      <span class="ml-2 font-medium">
        {{ ignoreCount }} ignore {{ ignoreCount === 1 ? "rule" : "rules" }}
      </span>
    </div>
    <div class="mb-4 flex flex-col gap-3 options-panel p-3">
    <div class="flex flex-wrap items-center gap-2">
      <div class="relative flex-1 min-w-[220px]">
        <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal-600" />
        <Input
          v-model="searchQuery"
          class="pl-9"
          placeholder="Search by RegExp or description"
          aria-label="Search rules"
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
        Import JSON
      </Button>
      <Button variant="outline" @click="exportRules">
        <Download />
        Export JSON
      </Button>
      <Button @click="open = true">
        <Plus />
        Create
      </Button>
    </div>
    <div class="flex flex-wrap items-center gap-3 text-sm">
      <div class="flex items-center gap-2 text-teal-700">
        <Filter class="size-4" />
        <span>Filters</span>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <span class="mr-1 text-xs font-medium text-slate-500">Open In</span>
        <Button
          size="sm"
          :variant="openInFilter === 'all' ? 'secondary' : 'outline'"
          aria-pressed="openInFilter === 'all'"
          @click="openInFilter = 'all'"
        >
          All
        </Button>
        <Button
          size="sm"
          :variant="openInFilter === OpenIn.Normal ? 'secondary' : 'outline'"
          aria-pressed="openInFilter === OpenIn.Normal"
          @click="openInFilter = OpenIn.Normal"
        >
          Normal
        </Button>
        <Button
          size="sm"
          :variant="openInFilter === OpenIn.Incognito ? 'secondary' : 'outline'"
          aria-pressed="openInFilter === OpenIn.Incognito"
          @click="openInFilter = OpenIn.Incognito"
        >
          Incognito
        </Button>
        <Button
          size="sm"
          :variant="openInFilter === OpenIn.Ignore ? 'secondary' : 'outline'"
          aria-pressed="openInFilter === OpenIn.Ignore"
          @click="openInFilter = OpenIn.Ignore"
        >
          Ignore
        </Button>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <span class="mr-1 text-xs font-medium text-slate-500">Status</span>
        <Button
          size="sm"
          :variant="enabledFilter === 'all' ? 'secondary' : 'outline'"
          aria-pressed="enabledFilter === 'all'"
          @click="enabledFilter = 'all'"
        >
          All
        </Button>
        <Button
          size="sm"
          :variant="enabledFilter === 'enabled' ? 'secondary' : 'outline'"
          aria-pressed="enabledFilter === 'enabled'"
          @click="enabledFilter = 'enabled'"
        >
          Enabled
        </Button>
        <Button
          size="sm"
          :variant="enabledFilter === 'disabled' ? 'secondary' : 'outline'"
          aria-pressed="enabledFilter === 'disabled'"
          @click="enabledFilter = 'disabled'"
        >
          Disabled
        </Button>
      </div>
      <div class="options-muted-chip rounded-md px-2 py-1 text-sm md:ml-auto">
        {{ totalCount }} rules · {{ disabledCount }} disabled
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
