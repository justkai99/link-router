<script setup lang="ts">
import { Plus } from "lucide-vue-next";
import { DialogType } from "@/lib/types";
import CreateAndEditDialog from "./components/CreateAndEditDialog.vue";
import Button from "@/components/ui/button/Button.vue";
import RulesTable from "./components/RulesTable.vue";

const rules = ref<any>([]);

const open = ref(false);

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
  <Button @click="open = true" class="mb-4">
    <Plus />
    Create
  </Button>
  <div>
    <RulesTable :rules />
  </div>
  <CreateAndEditDialog
    v-if="open"
    :type="DialogType.Create"
    :rules
    v-model:open="open"
  />
</template>
