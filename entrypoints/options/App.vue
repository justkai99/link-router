<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// 定义验证规则
const formSchema = toTypedSchema(
  z.object({
    rule: z.string(),
    description: z.string(),
    target: z.string(),
    enabled: z.boolean().optional(),
  })
);

// 创建表单实例
const { handleSubmit, errors, defineField } = useForm({
  validationSchema: formSchema,
  initialValues: {
    rule: "",
    description: "",
    target: "normal",
    enabled: true,
  },
});

// 定义字段
const [rule, ruleAttrs] = defineField("rule");
const [description, descriptionAttrs] = defineField("description");
const [target, targetAttrs] = defineField("target");
const [enabled, enabledAttrs] = defineField("enabled");

// 提交处理
const onSubmit = handleSubmit((values) => {
  console.log("表单提交成功:", values);
  // 这里可以发送数据到后端
});
</script>

<template>
  <form @submit="onSubmit" class="w-full max-w-md space-y-6">
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
      <FieldLabel for="target">Target</FieldLabel>
      <RadioGroup id="target" v-model="target" v-bind="targetAttrs">
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="r1" value="normal" />
          <Label for="r1">Normal</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem id="r2" value="incognito" />
          <Label for="r2">Comfortable</Label>
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

    <Button type="submit">提交</Button>
  </form>
</template>
