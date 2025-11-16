export default defineBackground(() => {
  // 使用变量缓存规则值
  let cachedRule: string | null = null;

  // 初始化时加载
  (async () => {
    try {
      cachedRule = await storage.getItem<string>("local:rule");

      if (!cachedRule) {
        cachedRule = "github";
        await storage.setItem("local:rule", cachedRule);
      }

      console.log("Background initialized. Rule:", cachedRule);

      // 监听存储变化，更新缓存
      storage.watch<string>("local:rule", (newRule) => {
        cachedRule = newRule;
        console.log("Rule updated:", newRule);
      });
    } catch (error) {
      console.error("Storage initialization error:", error);
    }
  })();

  // 使用缓存的规则值（同步访问）
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log("Tab updated:", tabId, changeInfo.url);
    if (!changeInfo.url) return;

    console.log("URL changed:", changeInfo.url);

    // 直接使用缓存值，无需 await
    if (cachedRule && changeInfo.url.includes(cachedRule)) {
      // browser.windows
      //   .create({
      //     url: "https://www.example.com/special",
      //     incognito: true,
      //   })
      //   .catch(console.error);
      // browser.tabs.remove(tabId).catch(console.error);
    }
  });
});
