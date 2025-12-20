<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DialogType, RuleItem } from "@/lib/types";
import CreateAndEditDialog from "./CreateAndEditDialog.vue";

const { rules } = defineProps<{ rules: RuleItem[] }>();

const open = ref(false);

const editRuleItem = ref<RuleItem | null>(null);

const edit = (ruleItem: RuleItem) => {
  open.value = true;
  editRuleItem.value = ruleItem;
};

const deleteRule = async (ruleItem: RuleItem, close: () => void) => {
  const index = rules.findIndex((r) => r.id === ruleItem.id);
  if (index !== -1) {
    rules.splice(index, 1);
    await storage.setItem("local:rules", JSON.stringify(rules));
    close();
  }
};
</script>

<template>
  <Table>
    <TableCaption>A list of your link router rules.</TableCaption>
    <TableHeader>
      <TableRow>
        <TableHead class="w-[50px]">#</TableHead>
        <TableHead>RegExp</TableHead>
        <TableHead>Description</TableHead>
        <TableHead class="w-[100px]">Open With</TableHead>
        <TableHead class="w-[100px]">Enabled</TableHead>
        <TableHead>Created At</TableHead>
        <TableHead>Updated At</TableHead>
        <TableHead class="w-[140px]">Operations</TableHead>
      </TableRow>
    </TableHeader>

    <TableBody>
      <TableRow
        v-for="(ruleItem, index) in rules"
        :key="ruleItem.id"
        class="align-top"
      >
        <TableCell class="font-medium w-[50px] text-center">
          {{ index + 1 }}
        </TableCell>

        <!-- RegExp: truncate with tooltip for long values -->
        <TableCell class="max-w-xs">
          <div class="truncate" :title="ruleItem.regexp">
            {{ ruleItem.regexp }}
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
            class="inline-block px-2 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-800"
            :title="ruleItem.openWith"
          >
            {{ ruleItem.openWith || "-" }}
          </span>
        </TableCell>

        <!-- Enabled: clear visual indicator -->
        <TableCell class="text-center">
          <span
            :class="
              ruleItem.enabled
                ? 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm bg-green-100 text-green-800'
                : 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-sm bg-red-100 text-red-800'
            "
            :aria-pressed="ruleItem.enabled ? 'true' : 'false'"
            :title="ruleItem.enabled ? 'Enabled' : 'Disabled'"
          >
            <span v-if="ruleItem.enabled">✓</span>
            <span v-else>✗</span>
            <span class="ml-1">{{
              ruleItem.enabled ? "Enabled" : "Disabled"
            }}</span>
          </span>
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
        <TableCell class="space-x-2">
          <Button
            variant="link"
            size="sm"
            @click="edit(ruleItem)"
            aria-label="Edit rule"
            title="Edit"
          >
            Edit
          </Button>

          <Popover v-slot="{ close }">
            <PopoverTrigger>
              <Button
                variant="link"
                size="sm"
                class="text-red-600"
                aria-label="Delete rule"
                title="Delete"
              >
                Delete
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-56">
              <p class="text-sm">Are you sure you want to delete this rule?</p>
              <div class="mt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" @click="close"
                  >Cancel</Button
                >
                <Button
                  variant="destructive"
                  size="sm"
                  @click="deleteRule(ruleItem, close)"
                >
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
            No rules found. Create your first rule to get started.
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>

  <CreateAndEditDialog
    v-if="open"
    :type="DialogType.Edit"
    :rule-item="editRuleItem"
    :rules="rules"
    v-model:open="open"
  />
</template>
