export default defineBackground(() => {
  // 使用变量缓存规则值
  let cachedRules: [] = [];

  // 初始化时加载
  (async () => {
    try {
      const localRules: any = await storage.getItem("local:rules");
      cachedRules = JSON.parse(localRules) || [];

      console.log("Background initialized. Rule:", cachedRules);

      // 监听存储变化，更新缓存
      storage.watch("local:rules", (newRule: any) => {
        cachedRules = JSON.parse(newRule) || [];
        console.log("Rule updated:", newRule);
      });
    } catch (error) {
      console.error("Storage initialization error:", error);
    }
  })();

  // 使用缓存的规则值（同步访问）
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    console.log("tab: ", tab);
    if (!changeInfo.url) return;

    const matchRule: any = cachedRules.find((item: any) =>
      changeInfo.url!.includes(item.rule)
    );
    console.log("matchRule: ", matchRule);
    if (matchRule) {
      // 已在目标窗口打开则不处理
      if (
        (matchRule.target === "incognito" && tab.incognito) ||
        (matchRule.target === "normal" && !tab.incognito)
      ) {
        return;
      }

      const windows = await browser.windows.getAll({
        populate: true,
        windowTypes: ["normal"],
      });

      if (matchRule.target === "incognito") {
        const incognitoWindow: any = windows.find((win) => win.incognito);
        if (incognitoWindow) {
          // 如果无痕窗口已存在，在该窗口中创建新标签页
          await browser.tabs.create({
            windowId: incognitoWindow.id,
            url: changeInfo.url,
            active: true,
          });

          // 将窗口置于前台
          await browser.windows.update(incognitoWindow.id, {
            focused: true,
          });
        } else {
          // 如果不存在，创建新的无痕窗口
          await browser.windows.create({
            url: changeInfo.url,
            incognito: true,
            focused: true,
          });
        }
      } else {
        const normalWindow: any = windows.find((win) => !win.incognito);
        if (normalWindow) {
          // 如果普通窗口已存在，在该窗口中创建新标签页
          await browser.tabs.create({
            windowId: normalWindow.id,
            url: changeInfo.url,
            active: true,
          });

          // 将窗口置于前台
          await browser.windows.update(normalWindow.id, {
            focused: true,
          });
        } else {
          // 如果不存在，创建新的普通窗口
          await browser.windows.create({
            url: changeInfo.url,
            incognito: false,
            focused: true,
          });
        }
      }

      browser.tabs.remove(tabId).catch(console.error);
    }
  });
});
