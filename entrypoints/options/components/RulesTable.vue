<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Chromium,
  HatGlasses,
  CircleSlash,
  ArrowUp,
  ArrowDown,
  Pencil,
  MoreHorizontal,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
  Trash2,
} from "lucide-vue-next";
import { DialogType, OpenIn, RuleItem } from "@/lib/types";
import CreateAndEditDialog from "./CreateAndEditDialog.vue";
import { uuid } from "@/lib/utils";

const emit = defineEmits<{
  (e: "create"): void;
  (e: "clear-filters"): void;
}>();

const { rules, sourceRules } = defineProps<{
  rules: RuleItem[];
  sourceRules: RuleItem[];
}>();

const open = ref(false);
const deleteDialogOpen = ref(false);
const deletingRule = ref<RuleItem | null>(null);

const editRuleItem = ref<RuleItem | null>(null);

const edit = (ruleItem: RuleItem) => {
  open.value = true;
  editRuleItem.value = ruleItem;
};

const saveRules = async () => {
  await storage.setItem("local:rules", JSON.stringify(sourceRules));
};

const enabledIgnoreRules = computed(() =>
  sourceRules.filter((rule) => rule.enabled && rule.openIn === OpenIn.Ignore),
);

const getRuleIndex = (ruleItem: RuleItem) =>
  sourceRules.findIndex((rule) => rule.id === ruleItem.id);

const isBroadIgnorePattern = (pattern: string) => {
  const normalized = pattern.trim();
  return (
    normalized === ".*" ||
    normalized === "^.*$" ||
    normalized === ".+" ||
    normalized === "^.+$" ||
    normalized === "^https?://.*$"
  );
};

const getShadowingIgnoreRule = (ruleItem: RuleItem) => {
  if (!ruleItem.enabled || ruleItem.openIn === OpenIn.Ignore) return null;
  return (
    enabledIgnoreRules.value.find((ignoreRule) => {
      if (ignoreRule.id === ruleItem.id) return false;
      return (
        ignoreRule.regexp === ruleItem.regexp ||
        isBroadIgnorePattern(ignoreRule.regexp)
      );
    }) || null
  );
};

const getShadowingWarning = (ruleItem: RuleItem) => {
  const ignoreRule = getShadowingIgnoreRule(ruleItem);
  if (!ignoreRule) return null;
  return `May never take effect because of Ignore rule: ${
    ignoreRule.description || ignoreRule.regexp
  }`;
};

const moveRule = async (fromIndex: number, toIndex: number) => {
  if (fromIndex < 0) return;
  if (toIndex < 0 || toIndex >= sourceRules.length) return;
  const [moved] = sourceRules.splice(fromIndex, 1);
  sourceRules.splice(toIndex, 0, moved);
  await saveRules();
};

const deleteRule = async (ruleItem: RuleItem) => {
  const index = getRuleIndex(ruleItem);
  if (index !== -1) {
    sourceRules.splice(index, 1);
    await saveRules();
  }
};

const requestDeleteRule = (ruleItem: RuleItem) => {
  deletingRule.value = ruleItem;
  deleteDialogOpen.value = true;
};

const confirmDeleteRule = async () => {
  if (!deletingRule.value) return;
  await deleteRule(deletingRule.value);
  deleteDialogOpen.value = false;
  deletingRule.value = null;
};

const cancelDeleteRule = () => {
  deleteDialogOpen.value = false;
  deletingRule.value = null;
};

const toggleEnabled = async (ruleItem: RuleItem, value: boolean) => {
  ruleItem.enabled = value;
  ruleItem.updatedAt = new Date().toISOString();
  await saveRules();
};

const duplicateRule = async (ruleItem: RuleItem, close: () => void) => {
  const index = getRuleIndex(ruleItem);
  if (index === -1) return;
  const cloned: RuleItem = {
    ...ruleItem,
    id: uuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  sourceRules.splice(index + 1, 0, cloned);
  await saveRules();
  close();
};
</script>

<template>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[50px]">#</TableHead>
        <TableHead>RegExp</TableHead>
        <TableHead>Description</TableHead>
        <TableHead class="w-[120px]">Open In</TableHead>
        <TableHead class="w-[120px]">Enabled</TableHead>
        <TableHead class="w-[160px]">Created At</TableHead>
        <TableHead class="w-[160px]">Updated At</TableHead>
        <TableHead class="w-[150px]">Operations</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <TableRow
        v-for="ruleItem in rules"
        :key="ruleItem.id"
        class="align-top cursor-pointer transition-colors hover:bg-cyan-50/70"
        @click="edit(ruleItem)"
      >
        <TableCell class="font-medium w-[50px]">
          {{ getRuleIndex(ruleItem) + 1 }}
        </TableCell>

        <!-- RegExp: truncate with tooltip for long values -->
        <TableCell class="max-w-xs">
          <div class="truncate" :title="ruleItem.regexp">
            {{ ruleItem.regexp }}
          </div>
          <div
            v-if="getShadowingWarning(ruleItem)"
            class="mt-1 text-xs text-amber-700"
            :title="getShadowingWarning(ruleItem) || undefined"
          >
            {{ getShadowingWarning(ruleItem) }}
          </div>
        </TableCell>

        <!-- Description: truncate with tooltip -->
        <TableCell class="max-w-sm">
          <div class="truncate" :title="ruleItem.description">
            {{ ruleItem.description || "-" }}
          </div>
        </TableCell>

        <!-- Open With: styled badge -->
        <TableCell>
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-sm font-medium"
            :class="
              ruleItem.openIn === OpenIn.Incognito
                ? 'bg-amber-100 text-amber-900'
                : ruleItem.openIn === OpenIn.Ignore
                  ? 'bg-rose-100 text-rose-900'
                  : 'bg-sky-100 text-sky-900'
            "
            :title="ruleItem.openIn"
          >
            <template v-if="ruleItem.openIn === OpenIn.Incognito">
              <HatGlasses class="inline" :size="18" />
              Incognito
            </template>
            <template v-else-if="ruleItem.openIn === OpenIn.Ignore">
              <CircleSlash class="inline" :size="18" />
              Ignore
              <span
                class="rounded bg-rose-200 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
              >
                Highest Priority
              </span>
            </template>
            <template v-else>
              <Chromium class="inline" :size="18" />
              Normal
            </template>
          </span>
        </TableCell>

        <!-- Enabled: clear visual indicator -->
        <TableCell class="text-center">
          <label class="inline-flex items-center gap-2 text-sm">
            <Checkbox
              v-model="ruleItem.enabled"
              @click.stop
              @update:modelValue="
                (value) => toggleEnabled(ruleItem, value === true)
              "
            />
            <span
              class="font-medium"
              :class="ruleItem.enabled ? 'text-emerald-700' : 'text-slate-500'"
            >
              {{ ruleItem.enabled ? "Enabled" : "Disabled" }}
            </span>
          </label>
        </TableCell>

        <!-- Dates: formatted, fallback to '-' -->
        <TableCell>
          {{
            ruleItem.createdAt
              ? new Date(ruleItem.createdAt).toLocaleString()
              : "-"
          }}
        </TableCell>
        <TableCell>
          {{
            ruleItem.updatedAt
              ? new Date(ruleItem.updatedAt).toLocaleString()
              : "-"
          }}
        </TableCell>

        <!-- Operations: Edit + Delete with confirmation -->
        <TableCell class="space-x-2" @click.stop>
          <Button
            variant="link"
            size="sm"
            :disabled="getRuleIndex(ruleItem) === 0"
            @click.stop="
              moveRule(getRuleIndex(ruleItem), getRuleIndex(ruleItem) - 1)
            "
            aria-label="Move rule up"
            :title="
              ruleItem.openIn === OpenIn.Ignore
                ? 'Ignore rules always override non-ignore rules; order only matters among Ignore rules.'
                : 'Move up'
            "
            :class="ruleItem.openIn === OpenIn.Ignore ? 'text-slate-500' : ''"
          >
            <ArrowUp class="size-4" />
            Up
          </Button>
          <Button
            variant="link"
            size="sm"
            :disabled="getRuleIndex(ruleItem) === sourceRules.length - 1"
            @click.stop="
              moveRule(getRuleIndex(ruleItem), getRuleIndex(ruleItem) + 1)
            "
            aria-label="Move rule down"
            :title="
              ruleItem.openIn === OpenIn.Ignore
                ? 'Ignore rules always override non-ignore rules; order only matters among Ignore rules.'
                : 'Move down'
            "
            :class="ruleItem.openIn === OpenIn.Ignore ? 'text-slate-500' : ''"
          >
            <ArrowDown class="size-4" />
            Down
          </Button>

          <Button
            variant="link"
            size="sm"
            @click.stop="edit(ruleItem)"
            aria-label="Edit rule"
            title="Edit"
          >
            <Pencil class="size-4" />
            Edit
          </Button>

          <Popover v-slot="{ close }">
            <PopoverTrigger as-child>
              <Button
                variant="outline"
                size="sm"
                aria-label="More actions"
                title="More actions"
              >
                <MoreHorizontal class="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-56 p-2">
              <div class="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start"
                  @click.stop.prevent="duplicateRule(ruleItem, close)"
                >
                  <Copy class="size-4" />
                  Duplicate
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start"
                  :disabled="getRuleIndex(ruleItem) === 0"
                  :title="
                    ruleItem.openIn === OpenIn.Ignore
                      ? 'Ignore rules always override non-ignore rules; order only matters among Ignore rules.'
                      : 'Move to top'
                  "
                  @click.stop.prevent="
                    moveRule(getRuleIndex(ruleItem), 0);
                    close();
                  "
                >
                  <ArrowUpToLine class="size-4" />
                  Move to top
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start"
                  :disabled="
                    getRuleIndex(ruleItem) === sourceRules.length - 1
                  "
                  :title="
                    ruleItem.openIn === OpenIn.Ignore
                      ? 'Ignore rules always override non-ignore rules; order only matters among Ignore rules.'
                      : 'Move to bottom'
                  "
                  @click.stop.prevent="
                    moveRule(getRuleIndex(ruleItem), sourceRules.length - 1);
                    close();
                  "
                >
                  <ArrowDownToLine class="size-4" />
                  Move to bottom
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="justify-start text-red-600 hover:text-red-700"
                  @click.stop.prevent="
                    requestDeleteRule(ruleItem);
                    close();
                  "
                >
                  <Trash2 class="size-4" />
                  Delete
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </TableCell>
      </TableRow>

      <!-- Empty state -->
      <TableRow v-if="rules.length === 0">
        <TableCell colspan="8" class="text-center py-6">
          <div class="text-sm text-slate-500">
            <template v-if="sourceRules.length === 0">
              <div class="font-medium text-slate-700">No rules yet.</div>
              <div class="mt-1">
                Example: <code class="rounded bg-cyan-100 px-1 py-0.5 text-cyan-900">^https://mail.google.com</code>
              </div>
              <Button class="mt-3" @click.stop="emit('create')">
                Create your first rule
              </Button>
            </template>
            <template v-else>
              No matching rules.
              <Button variant="link" size="sm" @click.stop="emit('clear-filters')">
                Clear filters
              </Button>
            </template>
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <CreateAndEditDialog
    v-if="open"
    :type="DialogType.Edit"
    :rule-item="editRuleItem"
    :rules="sourceRules"
    v-model:open="open"
  />

  <Dialog v-model:open="deleteDialogOpen">
    <DialogContent class="sm:max-w-[420px]">
      <DialogHeader>
        <DialogTitle>Delete Rule</DialogTitle>
        <DialogDescription>
          This action cannot be undone. The selected rule will be permanently
          removed.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelDeleteRule">Cancel</Button>
        <Button variant="destructive" @click="confirmDeleteRule">
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
