# YouTube Content Filter - 净化与定制 YouTube 浏览体验

一个轻量级的 [篡改猴 (Tampermonkey)](https://www.tampermonkey.net/) 用户脚本，支持分别独立屏蔽 YouTube 上的 **Shorts 短视频**、**直播内容**、**游戏板块**、**YouTube精选/合辑** 与 **常规长视频**，内置深色毛玻璃设置面板与油猴菜单双重管理。

## ✨ 功能特性

- 📱 **精准屏蔽 Shorts**：深度清除首页 Shorts 货架、单条推荐卡片、侧边栏导航入口以及搜索结果流中的 Shorts
- 🔴 **屏蔽 直播内容 (Live)**：过滤推荐信息流中带有 `LIVE` 徽标的直播视频卡片及侧边栏直播专区入口
- 🎮 **屏蔽 游戏板块 (Gaming)**：去除侧边栏“游戏”导航分类入口、首页游戏聚合货架与游戏相关推荐
- ✨ **屏蔽 YouTube精选 / 合辑 (Featured & Mixes)**：过滤首页推荐的“YouTube精选”专区货架、系统自动生成的精选合辑 (Mixes/Radio) 与带有精选标识的推荐卡片
- 🎬 **屏蔽 常规长视频**：适合专注模式、防沉迷或仅浏览订阅内容/播放列表的用户
- 📰 **扩展辅助过滤**：可选屏蔽社区动态帖子与图文动态
- ⚡ **零延迟与防闪烁**：基于原生 CSS `:has()` 瞬时注入与轻量级 DOM 监听，杜绝页面加载闪烁
- 🎨 **现代化设置面板**：内置与 YouTube 视觉风格深度契合的深色设置弹窗，开关即时生效，无需手动刷新

## 🚀 安装方式

> ⚠️ 前置要求：已安装 [Tampermonkey 浏览器扩展](https://www.tampermonkey.net/)（支持 Chrome / Edge / Firefox / Safari 等主流浏览器）

### 方式一：一键安装（推荐，自动识别新版本）

<a href="https://UesugiKou.github.io/youtube-content-filter/youtube-content-filter.user.js">
  <img src="https://img.shields.io/badge/%E7%82%B9%E5%87%BB%E5%AE%89%E8%A3%85-%E7%AB%99%E5%A4%96%E7%89%88%E6%9C%AC%E4%B8%8B%E8%BD%BD-FF0033?style=for-the-badge&logo=tampermonkey&logoColor=white" alt="点击一键安装" style="height: 50px;"/>
</a>

<br/>
<br/>

或者直接点击这个链接：[https://UesugiKou.github.io/youtube-content-filter/youtube-content-filter.user.js](https://UesugiKou.github.io/youtube-content-filter/youtube-content-filter.user.js)
> 篡改猴会自动识别 `.user.js` 后缀并弹出安装窗口，点击「安装」即可。

*(备用镜像 / GitHub Raw 链接：[点击此处直接安装](https://raw.githubusercontent.com/UesugiKou/youtube-content-filter/main/youtube-content-filter.user.js))*

### 方式二：手动安装

1. 安装 Tampermonkey 扩展
2. 打开脚本源码：[youtube-content-filter.user.js](youtube-content-filter.user.js)
3. 复制全部代码
4. 点击浏览器右上角 Tampermonkey 图标 → 添加新脚本 → 粘贴代码 → `Ctrl + S` 保存

## 📋 支持屏蔽的内容板块

| 过滤选项 | 对应板块 | 默认状态 | 说明 |
| :--- | :--- | :---: | :--- |
| 📱 **屏蔽 Shorts 短视频** | `Shorts` 视频流与专区 | **开启** | 隐藏首页货架、单个 Shorts 推荐、侧边栏入口与搜索结果流 |
| 🔴 **屏蔽 直播内容 (Live)** | 正在进行的直播 | 关闭 | 隐藏推荐信息流中带有 `LIVE` / 直播标签的卡片及侧边栏直播入口 |
| 🎮 **屏蔽 游戏板块 (Gaming)** | 游戏专区与推荐 | **开启** | 隐藏侧边栏“游戏”频道入口、首页游戏聚合货架与相关标签 |
| ✨ **屏蔽 YouTube精选 / 合辑** | 精选货架与 Mixes | **开启** | 隐藏首页“YouTube精选”专区货架、自动生成的精选合辑 (Mixes) 与带精选标识的卡片 |
| 🎬 **屏蔽 常规长视频** | 普通视频信息流 | 关闭 | 隐藏主页普通长视频（适合防沉迷或仅浏览订阅/播放列表） |
| 📰 **屏蔽 社区动态与图文帖子** | 社区贴、投票 | 关闭 | 隐藏图文动态、投票卡片与推荐流中的社区帖子 |
| 🔘 **显示右下角设置浮标** | 悬浮设置按钮 | **开启** | 控制右下角 ⚙️ 齿轮按钮的显隐（关闭后仍可通过油猴菜单打开） |

## 🎯 使用与管理方式

脚本安装后**自动运行**，提供双重便捷管理：

1. **页面悬浮面板**：
   - 浏览 YouTube 网页时，点击右下角的 ⚙️ 齿轮按钮。
   - 在弹出的深色毛玻璃设置面板中按需勾选或关闭各项功能。
   - 所有变动**即时生效，无需刷新网页**。
2. **篡改猴插件菜单**：
   - 点击浏览器工具栏上的 Tampermonkey 图标。
   - 在菜单中点击 **“⚙️ 打开过滤器设置面板”** 或直接快捷切换各个板块的开关。

## 🔄 远程链接订阅与自动更新

本项目原生支持篡改猴的自动检查更新与版本同步机制：

1. **元数据配置**：脚本头部已配置 `@updateURL` 与 `@downloadURL` 指向 GitHub 发布的最新脚本地址。
2. **开启 GitHub Pages（用于提供稳定更新源）**：
   - 进入本仓库的 GitHub 页面，点击顶部 **Settings**。
   - 在左侧菜单找到 **Pages**。
   - 在 **Build and deployment** 下方的 **Source** 选择 `Deploy from a branch`。
   - 分支选择 `main`，目录选择 `/ (root)`，点击 **Save**。
   - 部署完成后，脚本更新源 `https://UesugiKou.github.io/youtube-content-filter/youtube-content-filter.user.js` 即正式上线。
3. **自动更新体验**：
   - 开启后，每当仓库发布新版本，篡改猴扩展将在后台自动检测或在您点击“检查用户脚本更新”时一键同步到最新版。

## 📄 许可证

[MIT License](LICENSE)
