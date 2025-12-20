export interface RuleItem {
  id?: string;
  regexp: string;
  description: string;
  openWith: OpenWith;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum OpenWith {
  Normal = "normal",
  Incognito = "incognito",
}

export enum DialogType {
  Create = "Create",
  Edit = "Edit",
}
