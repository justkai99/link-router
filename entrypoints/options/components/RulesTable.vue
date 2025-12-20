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
        <TableHead class="w-[50px]"> # </TableHead>
        <TableHead> RegExp </TableHead>
        <TableHead> Description </TableHead>
        <TableHead> Open With </TableHead>
        <TableHead> Enabled </TableHead>
        <TableHead> Created At </TableHead>
        <TableHead> Updated At </TableHead>
        <TableHead class="w-[100px]"> Operations </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow v-for="(ruleItem, index) in rules" :key="ruleItem.id">
        <TableCell class="font-medium">
          {{ index + 1 }}
        </TableCell>
        <TableCell>{{ ruleItem.regexp }}</TableCell>
        <TableCell>{{ ruleItem.description }}</TableCell>
        <TableCell>{{ ruleItem.openWith }}</TableCell>
        <TableCell>{{ ruleItem.enabled }}</TableCell>
        <TableCell>{{ ruleItem.createdAt }}</TableCell>
        <TableCell>{{ ruleItem.updatedAt }}</TableCell>
        <TableCell>
          <Button variant="link" size="sm" @click="edit(ruleItem)">
            Edit
          </Button>
          <Popover v-slot="{ close }">
            <PopoverTrigger>
              <Button variant="link" size="sm" class="text-red-600">
                Delete
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-48">
              <p>Are you sure you want to delete this rule?</p>
              <div class="mt-4 flex justify-end space-x-2">
                <Button variant="outline" size="sm" @click="close">
                  Cancel
                </Button>
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
      <TableRow v-if="rules.length === 0">
        <TableCell colspan="8" class="text-center"> No rules found. </TableCell>
      </TableRow>
    </TableBody>
  </Table>
  <CreateAndEditDialog
    v-if="open"
    :type="DialogType.Edit"
    :rule-item="editRuleItem"
    :rules
    v-model:open="open"
  />
</template>
