import { createApp } from "vue";
import "@/assets/tailwind.css";
import "./style.css";
import App from "./App.vue";
import { setDocumentLocaleAttributes, t } from "@/lib/i18n";

setDocumentLocaleAttributes();
document.title = t("optionsPageTitle");

createApp(App).mount("#app");
