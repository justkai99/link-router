<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";
import { DialogType, RuleItem } from "@/lib/types";
import { uuid } from "@/lib/utils";

interface Props {
  type: DialogType;
  ruleItem?: RuleItem | null;
  rules: RuleItem[];
}

const { type, ruleItem, rules } = defineProps<Props>();
const open = defineModel<boolean>("open");

// 定义验证规则
const formSchema = toTypedSchema(
  z.object({
    rule: z.string().min(1, "Rule is required"),
    description: z.string().min(1, "Description is required"),
    openWith: z.enum(["normal", "incognito"]),
    enabled: z.boolean().optional(),
  })
);

// 创建表单实例
const { handleSubmit, errors, defineField } = useForm({
  validationSchema: formSchema,
  initialValues: {
    rule: ruleItem?.rule || "",
    description: ruleItem?.description || "",
    openWith: ruleItem?.openWith || "normal",
    enabled: ruleItem?.enabled !== undefined ? ruleItem.enabled : true,
  },
});

// 定义字段
const [rule, ruleAttrs] = defineField("rule");
const [description, descriptionAttrs] = defineField("description");
const [openWith, openWithAttrs] = defineField("openWith");
const [enabled, enabledAttrs] = defineField("enabled");

// 提交处理
const submit = handleSubmit((formData) => {
  if (type === DialogType.Create) {
    create(formData as RuleItem);
  } else if (type === DialogType.Edit) {
    edit(formData as RuleItem);
  }
});

const create = async (formData: RuleItem) => {
  const newRule: RuleItem = {
    id: uuid(),
    rule: formData.rule,
    description: formData.description,
    openWith: formData.openWith,
    enabled: formData.enabled,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  rules.push(newRule);
  await storage.setItem("local:rules", JSON.stringify(rules));
  open.value = false;
};

const edit = async (formData: RuleItem) => {
  if (!ruleItem) return;
  const index = rules.findIndex((r) => r.id === ruleItem.id);
  if (index !== -1) {
    rules[index] = {
      ...rules[index],
      rule: formData.rule,
      description: formData.description,
      openWith: formData.openWith,
      enabled: formData.enabled,
      updatedAt: new Date().toISOString(),
    };
    await storage.setItem("local:rules", JSON.stringify(rules));
    open.value = false;
  }
};

const close = () => {
  open.value = false;
};
</script>

<template>
  <Dialog v-model:open="open">
    <form class="w-full max-w-md space-y-6">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ type }} Rule</DialogTitle>
        </DialogHeader>

        <Field>
          <FieldLabel for="rule">Rule</FieldLabel>
          <Input
            id="rule"
            v-model="rule"
            v-bind="ruleAttrs"
            placeholder=""
            :aria-invalid="!!errors.rule"
          />
          <FieldDescription>Please input rule</FieldDescription>
          <FieldError v-if="errors.rule">
            {{ errors.rule }}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel for="description">Description</FieldLabel>
          <Input
            id="description"
            v-model="description"
            v-bind="descriptionAttrs"
            placeholder=""
            :aria-invalid="!!errors.description"
          />
          <FieldDescription>Please input description</FieldDescription>
          <FieldError v-if="errors.description">
            {{ errors.description }}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel for="openWith">Open With</FieldLabel>
          <RadioGroup id="openWith" v-model="openWith" v-bind="openWithAttrs">
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="r1" value="normal" />
              <Label for="r1">Normal</Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem id="r2" value="incognito" />
              <Label for="r2">Incognito</Label>
            </div>
          </RadioGroup>
        </Field>

        <Field>
          <FieldLabel for="enabled">Enabled</FieldLabel>
          <div>
            <Checkbox
              id="enabled"
              v-model="enabled"
              v-bind="enabledAttrs"
              :aria-invalid="!!errors.enabled"
            />
          </div>
          <FieldDescription>Enable or disable the rule</FieldDescription>
          <FieldError v-if="errors.enabled">
            {{ errors.enabled }}
          </FieldError>
        </Field>

        <DialogFooter>
          <DialogClose as-child>
            <Button variant="outline" @click="close"> Cancel </Button>
          </DialogClose>
          <Button type="submit" @click="submit"> Save </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
</template>
