export interface RuleItem {
  id?: string;
  regexp: string;
  description: string;
  openIn: OpenIn;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export enum OpenIn {
  Normal = "normal",
  Incognito = "incognito",
}

export enum DialogType {
  Create = "Create",
  Edit = "Edit",
}
