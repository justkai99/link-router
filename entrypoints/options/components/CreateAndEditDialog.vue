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
import { t } from "@/lib/i18n";

interface Props {
  type: DialogType;
  ruleItem?: RuleItem | null;
  rules: RuleItem[];
}

const { type, ruleItem, rules } = defineProps<Props>();
const open = defineModel<boolean>("open");
const regexpInput = ref<HTMLInputElement | null>(null);
const testUrl = ref("");

const dialogTitle = computed(() =>
  type === DialogType.Create ? t("createRuleTitle") : t("editRuleTitle"),
);

const testResult = computed(() => {
  if (!testUrl.value.trim()) return null;
  try {
    const regex = new RegExp(regexp.value || "");
    return regex.test(testUrl.value);
  } catch {
    return null;
  }
});

const testResultMessage = computed(() => {
  if (testResult.value === null) return t("testUrlHint");
  return testResult.value ? t("testUrlMatch") : t("testUrlNoMatch");
});

const formSchema = toTypedSchema(
  z.object({
    regexp: z
      .string()
      .min(1, t("regexpRequired"))
      .refine((value) => {
        try {
          new RegExp(value);
          return true;
        } catch {
          return false;
        }
      }, t("regexpInvalid")),
    description: z
      .string()
      .min(1, t("descriptionRequired"))
      .max(128, t("descriptionTooLong")),
    openIn: z.enum(OpenIn),
    enabled: z.boolean().optional(),
  }),
);

const { handleSubmit, errors, defineField } = useForm({
  validationSchema: formSchema,
  initialValues: {
    regexp: ruleItem?.regexp || "",
    description: ruleItem?.description || "",
    openIn: ruleItem?.openIn || OpenIn.Incognito,
    enabled: ruleItem?.enabled !== undefined ? ruleItem.enabled : true,
  },
});

const [regexp, regexpAttrs] = defineField("regexp");
const [description, descriptionAttrs] = defineField("description");
const [openIn, openInAttrs] = defineField("openIn");
const [enabled, enabledAttrs] = defineField("enabled");

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
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
        </DialogHeader>

        <Field>
          <FieldLabel for="regexp">{{ t("regexp") }}</FieldLabel>
          <Input
            id="regexp"
            ref="regexpInput"
            v-model="regexp"
            v-bind="regexpAttrs"
            :placeholder="t('inputPlaceholder')"
            :aria-invalid="!!errors.regexp"
          />
          <FieldDescription>
            {{ t("regexpHelp") }}
          </FieldDescription>
          <FieldError v-if="errors.regexp">
            {{ errors.regexp }}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel for="description">{{ t("description") }}</FieldLabel>
          <Input
            id="description"
            v-model="description"
            v-bind="descriptionAttrs"
            :placeholder="t('descriptionPlaceholder')"
            :aria-invalid="!!errors.description"
          />
          <FieldError v-if="errors.description">
            {{ errors.description }}
          </FieldError>
        </Field>

        <Field>
          <FieldLabel for="openIn">{{ t("openIn") }}</FieldLabel>
          <RadioGroup id="openIn" v-model="openIn" v-bind="openInAttrs">
            <span class="flex items-center space-x-2">
              <RadioGroupItem id="r1" value="normal" />
              <Label for="r1">{{ t("normal") }}</Label>
            </span>
            <span class="flex items-center space-x-2">
              <RadioGroupItem id="r2" value="incognito" />
              <Label for="r2">{{ t("incognito") }}</Label>
            </span>
            <span class="flex items-center space-x-2">
              <RadioGroupItem id="r3" value="ignore" />
              <Label for="r3">{{ t("ignoreDoNothing") }}</Label>
            </span>
          </RadioGroup>
          <FieldDescription v-if="openIn === OpenIn.Ignore">
            {{ t("ignorePriorityHelp") }}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel for="test-url">{{ t("testUrlOptional") }}</FieldLabel>
          <Input
            id="test-url"
            v-model="testUrl"
            :placeholder="t('testUrlPlaceholder')"
          />
          <FieldDescription>
            {{ testResultMessage }}
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel for="enabled">{{ t("enabled") }}</FieldLabel>
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
            <Button variant="outline" @click="close"> {{ t("cancel") }} </Button>
          </DialogClose>
          <Button type="submit" @click="submit"> {{ t("save") }} </Button>
        </DialogFooter>
      </DialogContent>
    </form>
  </Dialog>
</template>
