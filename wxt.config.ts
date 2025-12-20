import { defineConfig } from "wxt";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ["@wxt-dev/module-vue"],
  manifest: {
    permissions: ["tabs", "storage"],
    action: {}, // Enable the extension icon in the toolbar
    commands: {
      _execute_action: {
        // 固定 ID，专门用于打开 Popup
        suggested_key: {
          default: "Alt+2",
          mac: "Alt+2",
        },
        description: "打开插件面板",
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
