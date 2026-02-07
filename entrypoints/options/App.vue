<script setup lang="ts">
import { Plus, Search, Filter } from "lucide-vue-next";
import { DialogType, OpenIn, RuleItem } from "@/lib/types";
import CreateAndEditDialog from "./components/CreateAndEditDialog.vue";
import Button from "@/components/ui/button/Button.vue";
import RulesTable from "./components/RulesTable.vue";
import { Input } from "@/components/ui/input";

const rules = ref<RuleItem[]>([]);

const open = ref(false);
const searchQuery = ref("");
const openInFilter = ref<OpenIn | "all">("all");
const enabledFilter = ref<"all" | "enabled" | "disabled">("all");

const totalCount = computed(() => rules.value.length);
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
      <div class="rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-sm text-cyan-800 md:ml-auto">
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
