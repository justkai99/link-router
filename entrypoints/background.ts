import { OpenWith, RuleItem } from "@/lib/types";

export default defineBackground(() => {
  let rules: RuleItem[] = [];

  // 初始化时加载
  (async () => {
    try {
      const rulesJson: string | null = await storage.getItem("local:rules");
      rules = JSON.parse(rulesJson ?? "") || [];

      // 监听存储变化，更新缓存
      storage.watch("local:rules", (newRule: any) => {
        rules = JSON.parse(newRule) || [];
      });
    } catch (error) {
      console.error("Storage initialization error:", error);
    }
  })();

  // 使用缓存的规则值（同步访问）
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;

    const matchedRule = rules.find((item) =>
      new RegExp(item.regexp).test(changeInfo.url as string)
    );
    if (matchedRule) {
      // 已在目标窗口打开则不处理
      if (
        (matchedRule.openWith === OpenWith.Incognito && tab.incognito) ||
        (matchedRule.openWith === OpenWith.Normal && !tab.incognito)
      ) {
        return;
      }

      await openInNewTab(changeInfo.url, matchedRule.openWith);

      browser.tabs.remove(tabId).catch(console.error);
    }
  });

  // 点击扩展图标时的处理
  browser.action.onClicked.addListener(async (tab) => {
    await openInNewTab(
      tab.url!,
      tab.incognito ? OpenWith.Normal : OpenWith.Incognito
    );
    browser.tabs.remove(tab.id!).catch(console.error);
  });

  async function openInNewTab(url: string, openWith: OpenWith) {
    const windows = await browser.windows.getAll({
      populate: true,
      windowTypes: ["normal"],
    });

    if (openWith === OpenWith.Incognito) {
      const incognitoWindow = windows.find((win) => win.incognito);
      if (incognitoWindow) {
        // 如果无痕窗口已存在，在该窗口中创建新标签页
        await browser.tabs.create({
          windowId: incognitoWindow.id,
          url: url,
          active: true,
        });

        // 将窗口置于前台
        await browser.windows.update(incognitoWindow.id!, {
          focused: true,
        });
      } else {
        // 如果不存在，创建新的无痕窗口
        await browser.windows.create({
          url: url,
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
          url: url,
          active: true,
        });

        // 将窗口置于前台
        await browser.windows.update(normalWindow.id, {
          focused: true,
        });
      } else {
        // 如果不存在，创建新的普通窗口
        await browser.windows.create({
          url: url,
          incognito: false,
          focused: true,
        });
      }
    }
  }
});
