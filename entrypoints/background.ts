import { storage } from "#imports";
import { OpenIn, RuleItem } from "@/lib/types";

export default defineBackground(() => {
  let rules: RuleItem[] = [];

  // 初始化时加载
  (async () => {
    try {
      const rulesJson: string | null = await storage.getItem("local:rules");

      rules = JSON.parse(rulesJson ?? "[]");

      // 监听存储变化，更新缓存
      storage.watch("local:rules", (newRule: any) => {
        rules = JSON.parse(newRule ?? "[]");
      });
    } catch (error) {
      console.error("Storage initialization error:", error);
    }
  })();

  // 使用缓存的规则值（同步访问）
  browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;
    const targetUrl = changeInfo.url as string;

    const isMatch = (item: RuleItem) => {
      if (!item.enabled) return false;
      try {
        return new RegExp(item.regexp).test(targetUrl);
      } catch (error) {
        console.warn("Invalid RegExp skipped:", item.regexp, error);
        return false;
      }
    };

    // Ignore rules always have global priority regardless of list order.
    const hasIgnoreMatch = rules.some(
      (item) => item.openIn === OpenIn.Ignore && isMatch(item),
    );
    if (hasIgnoreMatch) return;

    const matchedRule = rules.find(
      (item) => item.openIn !== OpenIn.Ignore && isMatch(item),
    );
    if (matchedRule) {
      // 已在目标窗口打开则不处理
      if (
        (matchedRule.openIn === OpenIn.Incognito && tab.incognito) ||
        (matchedRule.openIn === OpenIn.Normal && !tab.incognito)
      ) {
        return;
      }

      await openInNewTab(targetUrl, matchedRule.openIn);
      browser.tabs.remove(tabId).catch(console.error);
    }
  });

  // 点击扩展图标时的处理
  browser.action.onClicked.addListener(async (tab) => {
    await openInNewTab(
      tab.url!,
      tab.incognito ? OpenIn.Normal : OpenIn.Incognito
    );
    browser.tabs.remove(tab.id!).catch(console.error);
  });

  async function openInNewTab(url: string, openIn: OpenIn) {
    const windows = await browser.windows.getAll({
      populate: true,
      windowTypes: ["normal"],
    });

    if (openIn === OpenIn.Incognito) {
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
