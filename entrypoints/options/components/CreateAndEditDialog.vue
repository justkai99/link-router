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
import { DialogType, OpenIn, RuleItem } from "@/lib/types";
import { uuid } from "@/lib/utils";

interface Props {
  type: DialogType;
  ruleItem?: RuleItem | null;
  rules: RuleItem[];
}

const { type, ruleItem, rules } = defineProps<Props>();
const open = defineModel<boolean>("open");
const regexpInput = ref<HTMLInputElement | null>(null);
const testUrl = ref("");

const testResult = computed(() => {
  if (!testUrl.value.trim()) return null;
  try {
    const regex = new RegExp(regexp.value || "");
    return regex.test(testUrl.value);
  } catch {
    return null;
  }
});

// 定义验证规则
const formSchema = toTypedSchema(
  z.object({
    regexp: z
      .string()
      .min(1, "RegExp is required")
      .refine((value) => {
        try {
          new RegExp(value);
          return true;
        } catch {
          return false;
        }
      }, "Invalid RegExp pattern"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(128, "Description is too long"),
    openIn: z.enum(OpenIn),
    enabled: z.boolean().optional(),
  }),
);

// 创建表单实例
const { handleSubmit, errors, defineField } = useForm({
  validationSchema: formSchema,
  initialValues: {
    regexp: ruleItem?.regexp || "",
    description: ruleItem?.description || "",
    openIn: ruleItem?.openIn || OpenIn.Incognito,
    enabled: ruleItem?.enabled !== undefined ? ruleItem.enabled : true,
  },
});

// 定义字段
const [regexp, regexpAttrs] = defineField("regexp");
const [description, descriptionAttrs] = defineField("description");
const [openIn, openInAttrs] = defineField("openIn");
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
    regexp: formData.regexp,
    description: formData.description,
    openIn: formData.openIn,
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
      regexp: formData.regexp,
      description: formData.description,
      openIn: formData.openIn,
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

watch(open, async (value) => {
  if (!value) return;
  testUrl.value = "";
  await nextTick();
  regexpInput.value?.focus();
});
</script>

<template>
  <Dialog v-model:open="open">
    <form class="w-full max-w-md space-y-6">
      <DialogContent class="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{{ type }} Rule</DialogTitle>
        </DialogHeader>

        <Field>
          <FieldLabel for="regexp">RegExp</FieldLabel>
          <Input
            id="regexp"
            ref="regexpInput"
            v-model="regexp"
            v-bind="regexpAttrs"
            placeholder="Please input"
            :aria-invalid="!!errors.regexp"
          />
          <FieldDescription>
            Use a valid JavaScript RegExp (e.g.
            <code>^https://mail.google.com</code>).
          </FieldDescription>
          <FieldError v-if="errors.regexp">
            {{ errors.regexp }}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel for="description">Description</FieldLabel>
          <Input
            id="description"
            v-model="description"
            v-bind="descriptionAttrs"
            placeholder="e.g. Work sites"
            :aria-invalid="!!errors.description"
          />
          <FieldError v-if="errors.description">
            {{ errors.description }}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel for="openIn">Open In</FieldLabel>
          <RadioGroup id="openIn" v-model="openIn" v-bind="openInAttrs">
            <span class="flex items-center space-x-2">
              <RadioGroupItem id="r1" value="normal" />
              <Label for="r1">Normal</Label>
            </span>
            <span class="flex items-center space-x-2">
              <RadioGroupItem id="r2" value="incognito" />
              <Label for="r2">Incognito</Label>
            </span>
            <span class="flex items-center space-x-2">
              <RadioGroupItem id="r3" value="ignore" />
              <Label for="r3">Ignore (Do nothing)</Label>
            </span>
          </RadioGroup>
          <FieldDescription v-if="openIn === OpenIn.Ignore">
            Ignore has global priority and will prevent routing when matched.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel for="test-url">Test URL (optional)</FieldLabel>
          <Input
            id="test-url"
            v-model="testUrl"
            placeholder="https://example.com/path"
          />
          <FieldDescription>
            {{
              testResult === null
                ? "Try an example URL to verify the pattern."
                : testResult
                  ? "Matches the pattern."
                  : "Does not match the pattern."
            }}
          </FieldDescription>
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
