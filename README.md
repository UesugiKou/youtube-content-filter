# YouTube Content Filter (Shorts / 直播 / 视频 / 游戏)

[English](#english) | [简体中文](#简体中文)

---

## 简体中文

一款适用于 **篡改猴 (Tampermonkey)** 的轻量高效 YouTube 网页内容过滤器。支持分别独立屏蔽 **Shorts 短视频**、**正在直播 (Live)**、**游戏板块 (Gaming)** 以及 **常规长视频**，并提供原生质感的毛玻璃悬浮设置面板与扩展菜单双重管理。

### 🌟 核心特性

- 📱 **精准屏蔽 Shorts**：深度清除首页 Shorts 货架、单条推荐卡片、侧边栏导航入口以及搜索结果流中的 Shorts。
- 🔴 **屏蔽 直播内容 (Live)**：过滤推荐信息流中带有 `LIVE` 徽标的直播视频卡片及侧边栏直播专题。
- 🎮 **屏蔽 游戏板块 (Gaming)**：去除侧边栏“游戏”导航分类入口、首页游戏聚合货架与游戏相关推荐。
- 🎬 **屏蔽 常规长视频**：适合防沉迷、专注模式或只想浏览订阅内容/播放列表的用户。
- 📰 **扩展辅助过滤**：可选屏蔽社区动态帖子与 YouTube 自动生成的 Mixes 合辑。
- ⚡ **零延迟与防闪烁**：结合 CSS `:has()` 瞬时注入与轻量 DOM 监听，杜绝页面加载闪烁。
- 🎨 **现代化设置面板**：内置与 YouTube 视觉深度契合的深色设置弹窗，开关**即时生效，无需手动刷新**。

### 🚀 安装指南

1. 安装浏览器扩展 [Tampermonkey (篡改猴)](https://www.tampermonkey.net/)。
2. 打开篡改猴管理面板，点击 **“+”** 新建脚本。
3. 将本项目中的 [`youtube-content-filter.user.js`](./youtube-content-filter.user.js) 源码复制粘贴至编辑器中。
4. 按 `Ctrl + S` 保存。
5. 刷新或访问 [YouTube](https://www.youtube.com/) 即可生效。

### ⚙️ 管理设置

- **悬浮按钮**：页面右下角常驻齿轮图标 ⚙️，点击即可唤出设置面板。
- **扩展菜单**：点击浏览器右上角的篡改猴图标，亦可在菜单中一键唤出面板或单独切换开关。

---

## English

A lightweight and efficient Tampermonkey userscript to customize and clean up your YouTube browsing experience. Filter out **Shorts**, **Live streams**, **Gaming section**, and **Regular video feeds** with independent toggles and a sleek in-page settings panel.

### Features
- 📱 **Hide Shorts**: Blocks Shorts shelves, individual Shorts cards in home/search feeds, and sidebar links.
- 🔴 **Hide Live Streams**: Filters out live stream video cards with live badges and the sidebar Live section.
- 🎮 **Hide Gaming**: Removes the Gaming category from the sidebar and gaming shelves from recommendations.
- 🎬 **Hide Standard Videos**: Enables minimal/focus mode by hiding general video feed cards.
- 🎨 **Sleek Settings Panel**: Glassmorphic dark UI modal matching YouTube's design, with instant effect updates.

### License
[MIT License](./LICENSE)
