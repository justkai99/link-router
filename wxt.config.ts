import { defineConfig } from "wxt";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  manifest: {
    default_locale: "en",
    name: "__MSG_extensionName__",
    description: "__MSG_extensionDescription__",
    permissions: ["tabs", "storage"],
    action: {}, // Enable the extension icon in the toolbar
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Alt+2",
          mac: "Alt+2",
        },
        description: "__MSG_commandOpenPanelDescription__",
      },
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
  }),
});
