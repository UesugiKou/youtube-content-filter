// ==UserScript==
// @name         YouTube 内容过滤器 (Shorts/直播/视频/游戏)
// @name:en      YouTube Content Filter (Shorts/Live/Videos/Gaming)
// @namespace    https://github.com/
// @version      1.0.0
// @description  便捷分别屏蔽 YouTube 上的 Shorts 短视频、直播内容、常规视频、游戏板块，支持可视化悬浮面板与油猴菜单分别独立管理。
// @author       Antigravity
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 默认配置
    const DEFAULT_CONFIG = {
        blockShorts: true,       // 屏蔽 Shorts
        blockLive: false,        // 屏蔽 直播
        blockGaming: true,       // 屏蔽 游戏板块
        blockVideos: false,      // 屏蔽 常规长视频
        blockPosts: false,       // 屏蔽 社区动态与合辑
        showFloatingBtn: true    // 显示右下角设置浮标
    };

    // 读取配置
    function loadConfig() {
        if (typeof GM_getValue === 'function') {
            return {
                blockShorts: GM_getValue('blockShorts', DEFAULT_CONFIG.blockShorts),
                blockLive: GM_getValue('blockLive', DEFAULT_CONFIG.blockLive),
                blockGaming: GM_getValue('blockGaming', DEFAULT_CONFIG.blockGaming),
                blockVideos: GM_getValue('blockVideos', DEFAULT_CONFIG.blockVideos),
                blockPosts: GM_getValue('blockPosts', DEFAULT_CONFIG.blockPosts),
                showFloatingBtn: GM_getValue('showFloatingBtn', DEFAULT_CONFIG.showFloatingBtn)
            };
        } else {
            try {
                const saved = localStorage.getItem('yt_content_filter_config');
                return saved ? Object.assign({}, DEFAULT_CONFIG, JSON.parse(saved)) : DEFAULT_CONFIG;
            } catch (e) {
                return DEFAULT_CONFIG;
            }
        }
    }

    // 保存配置
    function saveConfig(cfg) {
        if (typeof GM_setValue === 'function') {
            for (const [key, val] of Object.entries(cfg)) {
                GM_setValue(key, val);
            }
        } else {
            try {
                localStorage.setItem('yt_content_filter_config', JSON.stringify(cfg));
            } catch (e) {}
        }
    }

    let currentConfig = loadConfig();

    // 动态样式容器
    let filterStyleElement = null;

    // 生成过滤 CSS 规则
    function generateFilterCSS(cfg) {
        let css = '';

        // 1. 屏蔽 Shorts 规则
        if (cfg.blockShorts) {
            css += `
                /* 首页/频道页面 Shorts 货架与栏目 */
                ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
                ytd-rich-shelf-renderer[is-shorts],
                ytd-reel-shelf-renderer,
                ytd-rich-section-renderer:has(a[href*="/shorts"]),
                /* 侧边导航栏 Shorts 入口 */
                ytd-guide-entry-renderer:has(a[href^="/shorts"]),
                ytd-mini-guide-entry-renderer:has(a[href^="/shorts"]),
                /* 首页/搜索/订阅流中的单个 Shorts 视频卡片 */
                ytd-rich-item-renderer:has(a[href*="/shorts"]),
                ytd-video-renderer:has(a[href*="/shorts"]),
                ytd-compact-video-renderer:has(a[href*="/shorts"]),
                ytd-grid-video-renderer:has(a[href*="/shorts"]),
                ytd-reel-item-renderer,
                /* 备用标记属性选择器 */
                [data-yt-filter-type="shorts"] {
                    display: none !important;
                }
            `;
        }

        // 2. 屏蔽 直播 (Live) 规则
        if (cfg.blockLive) {
            css += `
                /* 正在直播的视频卡片 (通过 Live 徽标/Overlay 匹配) */
                ytd-rich-item-renderer:has([overlay-style="LIVE"]),
                ytd-rich-item-renderer:has(.badge-style-type-live-now-alternate),
                ytd-rich-item-renderer:has(.badge-style-type-live-now),
                ytd-rich-item-renderer:has(ytd-badge-supported-renderer [aria-label*="LIVE" i]),
                ytd-rich-item-renderer:has(ytd-badge-supported-renderer [aria-label*="直播" i]),
                ytd-video-renderer:has([overlay-style="LIVE"]),
                ytd-video-renderer:has(.badge-style-type-live-now-alternate),
                ytd-video-renderer:has(.badge-style-type-live-now),
                ytd-video-renderer:has(ytd-badge-supported-renderer [aria-label*="LIVE" i]),
                ytd-video-renderer:has(ytd-badge-supported-renderer [aria-label*="直播" i]),
                ytd-compact-video-renderer:has([overlay-style="LIVE"]),
                ytd-compact-video-renderer:has(.badge-style-type-live-now-alternate),
                ytd-compact-video-renderer:has(.badge-style-type-live-now),
                ytd-grid-video-renderer:has([overlay-style="LIVE"]),
                /* 侧边栏直播频道入口 (UC4R8F26TWlumLPZ76CS357g 为 YouTube 官方 Live 专题) */
                ytd-guide-entry-renderer:has(a[href*="/channel/UC4R8F26TWlumLPZ76CS357g"]),
                ytd-guide-entry-renderer:has(a[title="Live"], a[title="直播"]),
                /* 备用标记属性选择器 */
                [data-yt-filter-type="live"] {
                    display: none !important;
                }
            `;
        }

        // 3. 屏蔽 游戏板块 (Gaming) 规则
        if (cfg.blockGaming) {
            css += `
                /* 侧边导航栏游戏分类 (UCOpNcN46UbXVtpKMrmU4Abg 为 YouTube Gaming 专题) */
                ytd-guide-entry-renderer:has(a[href="/gaming"]),
                ytd-guide-entry-renderer:has(a[href^="/channel/UCOpNcN46UbXVtpKMrmU4Abg"]),
                ytd-mini-guide-entry-renderer:has(a[href="/gaming"]),
                /* 首页/推荐流中的游戏聚合货架与游戏卡片 */
                ytd-rich-shelf-renderer:has(a[href*="/gaming"]),
                ytd-rich-section-renderer:has(a[href*="/gaming"]),
                ytd-game-details-renderer,
                #game-details,
                /* 备用标记属性选择器 */
                [data-yt-filter-type="gaming"] {
                    display: none !important;
                }
            `;
        }

        // 4. 屏蔽 常规长视频 规则 (通常用于只浏览社区、特定专区或极致防沉迷)
        if (cfg.blockVideos) {
            css += `
                /* 首页与信息流中的普通视频项目 (排除已被 Shorts 或直播匹配的，避免误判) */
                ytd-rich-item-renderer:has(ytd-rich-grid-media:not(:has(a[href*="/shorts"]))),
                ytd-rich-item-renderer:has(#video-title:not([href*="/shorts"])),
                ytd-video-renderer:not(:has(a[href*="/shorts"])),
                ytd-compact-video-renderer:not(:has(a[href*="/shorts"])),
                [data-yt-filter-type="video"] {
                    display: none !important;
                }
            `;
        }

        // 5. 屏蔽 社区动态与合辑
        if (cfg.blockPosts) {
            css += `
                ytd-rich-section-renderer:has(ytd-post-renderer),
                ytd-post-renderer,
                ytd-radio-renderer,
                ytd-playlist-renderer,
                [data-yt-filter-type="post"] {
                    display: none !important;
                }
            `;
        }

        return css;
    }

    // 更新注入的 CSS
    function updateStyles() {
        if (!filterStyleElement) {
            filterStyleElement = document.createElement('style');
            filterStyleElement.id = 'yt-content-filter-styles';
            (document.head || document.documentElement).appendChild(filterStyleElement);
        }
        filterStyleElement.textContent = generateFilterCSS(currentConfig);
    }

    // 立即初始化基础 CSS
    updateStyles();

    // DOM 辅助观察器：辅助为动态渲染项添加 data-yt-filter-type 属性（作为 CSS :has() 的双重保障）
    function scanAndMarkItem(node) {
        if (!node || node.nodeType !== 1) return;

        // 标记 Shorts
        if (currentConfig.blockShorts) {
            if (node.tagName === 'YTD-RICH-ITEM-RENDERER' || node.tagName === 'YTD-VIDEO-RENDERER' || node.tagName === 'YTD-COMPACT-VIDEO-RENDERER') {
                const hasShortsLink = node.querySelector('a[href*="/shorts"]');
                if (hasShortsLink) {
                    node.setAttribute('data-yt-filter-type', 'shorts');
                    return;
                }
            }
        }

        // 标记 直播
        if (currentConfig.blockLive) {
            const hasLiveBadge = node.querySelector && node.querySelector('[overlay-style="LIVE"], .badge-style-type-live-now, .badge-style-type-live-now-alternate');
            if (hasLiveBadge) {
                if (node.tagName === 'YTD-RICH-ITEM-RENDERER' || node.tagName === 'YTD-VIDEO-RENDERER' || node.tagName === 'YTD-COMPACT-VIDEO-RENDERER') {
                    node.setAttribute('data-yt-filter-type', 'live');
                    return;
                }
            }
        }

        // 标记 游戏专区货架
        if (currentConfig.blockGaming) {
            if (node.tagName === 'YTD-RICH-SECTION-RENDERER' || node.tagName === 'YTD-RICH-SHELF-RENDERER') {
                const hasGamingLink = node.querySelector('a[href*="/gaming"]');
                if (hasGamingLink) {
                    node.setAttribute('data-yt-filter-type', 'gaming');
                    return;
                }
            }
        }
    }

    // 轻量级节流观察器
    let mutationTimer = null;
    const observer = new MutationObserver((mutations) => {
        if (mutationTimer) return;
        mutationTimer = setTimeout(() => {
            mutationTimer = null;
            const items = document.querySelectorAll('ytd-rich-item-renderer:not([data-yt-filter-type]), ytd-video-renderer:not([data-yt-filter-type]), ytd-compact-video-renderer:not([data-yt-filter-type])');
            items.forEach(scanAndMarkItem);
        }, 300);
    });

    // 页面加载完成后启动 MutationObserver 与 UI 创建
    document.addEventListener('DOMContentLoaded', () => {
        updateStyles();
        observer.observe(document.body, { childList: true, subtree: true });
        setupSettingsUI();
    });

    // ==========================================
    // 可视化设置面板 UI (支持悬浮按钮 + 弹窗)
    // ==========================================
    function setupSettingsUI() {
        if (document.getElementById('yt-filter-modal-container')) return;

        // 注入面板样式
        const uiStyle = document.createElement('style');
        uiStyle.id = 'yt-filter-ui-styles';
        uiStyle.textContent = `
            /* 悬浮设置按钮 */
            #yt-filter-float-btn {
                position: fixed;
                bottom: 24px;
                right: 24px;
                z-index: 99999;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff0033, #cc0000);
                color: #ffffff;
                border: none;
                box-shadow: 0 4px 16px rgba(255, 0, 51, 0.4);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 20px;
                transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.25s ease;
                user-select: none;
            }
            #yt-filter-float-btn:hover {
                transform: scale(1.1) rotate(20deg);
                box-shadow: 0 6px 20px rgba(255, 0, 51, 0.6);
            }
            #yt-filter-float-btn:active {
                transform: scale(0.95);
            }

            /* 遮罩背景 */
            #yt-filter-modal-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0, 0, 0, 0.65);
                backdrop-filter: blur(8px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }
            #yt-filter-modal-container.active {
                opacity: 1;
                pointer-events: auto;
            }

            /* 弹窗主体 */
            .yt-filter-modal {
                width: 420px;
                max-width: 90vw;
                background: #181818;
                border: 1px solid #303030;
                border-radius: 16px;
                color: #f1f1f1;
                font-family: "Roboto", "Segoe UI", Arial, sans-serif;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8);
                overflow: hidden;
                transform: translateY(20px) scale(0.96);
                transition: transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1);
            }
            #yt-filter-modal-container.active .yt-filter-modal {
                transform: translateY(0) scale(1);
            }

            /* 弹窗头部 */
            .yt-filter-header {
                padding: 18px 24px;
                background: #202020;
                border-bottom: 1px solid #2d2d2d;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .yt-filter-title {
                margin: 0;
                font-size: 17px;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #fff;
            }
            .yt-filter-title svg {
                fill: #ff0033;
                width: 22px;
                height: 22px;
            }
            .yt-filter-close-btn {
                background: transparent;
                border: none;
                color: #aaa;
                font-size: 22px;
                cursor: pointer;
                line-height: 1;
                padding: 4px;
                border-radius: 50%;
                transition: color 0.2s, background 0.2s;
            }
            .yt-filter-close-btn:hover {
                color: #fff;
                background: #333;
            }

            /* 列表与项目 */
            .yt-filter-body {
                padding: 16px 24px 20px;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .yt-filter-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 14px;
                background: #212121;
                border-radius: 12px;
                border: 1px solid #2c2c2c;
                transition: background 0.2s, border-color 0.2s;
            }
            .yt-filter-item:hover {
                background: #272727;
                border-color: #3d3d3d;
            }
            .yt-filter-label {
                display: flex;
                flex-direction: column;
                gap: 3px;
            }
            .yt-filter-name {
                font-size: 14px;
                font-weight: 500;
                color: #eee;
            }
            .yt-filter-desc {
                font-size: 12px;
                color: #8e8e8e;
            }

            /* 开关 Switch */
            .yt-filter-switch {
                position: relative;
                display: inline-block;
                width: 46px;
                height: 26px;
                flex-shrink: 0;
            }
            .yt-filter-switch input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            .yt-filter-slider {
                position: absolute;
                cursor: pointer;
                top: 0; left: 0; right: 0; bottom: 0;
                background-color: #3e3e3e;
                transition: .3s;
                border-radius: 26px;
            }
            .yt-filter-slider:before {
                position: absolute;
                content: "";
                height: 20px;
                width: 20px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 50%;
            }
            .yt-filter-switch input:checked + .yt-filter-slider {
                background-color: #ff0033;
            }
            .yt-filter-switch input:checked + .yt-filter-slider:before {
                transform: translateX(20px);
            }

            /* 底部栏 */
            .yt-filter-footer {
                padding: 12px 24px 16px;
                border-top: 1px solid #282828;
                display: flex;
                align-items: center;
                justify-content: space-between;
                font-size: 12px;
                color: #777;
            }
            .yt-filter-btn-save {
                background: #ff0033;
                color: #fff;
                border: none;
                border-radius: 8px;
                padding: 8px 18px;
                font-size: 13px;
                font-weight: 600;
                cursor: pointer;
                transition: background 0.2s;
            }
            .yt-filter-btn-save:hover {
                background: #cc0000;
            }
        `;
        document.head.appendChild(uiStyle);

        // 浮动按钮
        const floatBtn = document.createElement('button');
        floatBtn.id = 'yt-filter-float-btn';
        floatBtn.title = 'YouTube 过滤器设置';
        floatBtn.innerHTML = '⚙️';
        if (!currentConfig.showFloatingBtn) {
            floatBtn.style.display = 'none';
        }
        document.body.appendChild(floatBtn);

        // 弹窗结构
        const modalContainer = document.createElement('div');
        modalContainer.id = 'yt-filter-modal-container';
        modalContainer.innerHTML = `
            <div class="yt-filter-modal">
                <div class="yt-filter-header">
                    <h3 class="yt-filter-title">
                        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
                        YouTube 内容过滤器设置
                    </h3>
                    <button class="yt-filter-close-btn" id="yt-filter-close-btn">&times;</button>
                </div>
                <div class="yt-filter-body">
                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">📱 屏蔽 Shorts 短视频</span>
                            <span class="yt-filter-desc">隐藏主页货架、单个 Shorts 推荐与侧边栏入口</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockShorts" ${currentConfig.blockShorts ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>

                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">🔴 屏蔽 直播内容 (Live)</span>
                            <span class="yt-filter-desc">隐藏推荐流中正在直播的视频与侧边栏直播入口</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockLive" ${currentConfig.blockLive ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>

                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">🎮 屏蔽 游戏板块 (Gaming)</span>
                            <span class="yt-filter-desc">隐藏侧边栏游戏频道入口与推荐流中的游戏聚合货架</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockGaming" ${currentConfig.blockGaming ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>

                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">🎬 屏蔽 常规长视频</span>
                            <span class="yt-filter-desc">隐藏主页信息流的普通视频（适合防沉迷或仅使用订阅/播放列表）</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockVideos" ${currentConfig.blockVideos ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>

                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">📰 屏蔽 社区动态与官方合辑</span>
                            <span class="yt-filter-desc">隐藏投票、帖子动态以及 YouTube 自动生成的 Mixes</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockPosts" ${currentConfig.blockPosts ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>

                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">🔘 显示右下角设置浮标</span>
                            <span class="yt-filter-desc">关闭后可在篡改猴脚本菜单中随时重新开启</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-showFloatingBtn" ${currentConfig.showFloatingBtn ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="yt-filter-footer">
                    <span>设置即时生效，无需刷新</span>
                    <button class="yt-filter-btn-save" id="yt-filter-confirm-btn">完成</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);

        // 打开/关闭弹窗事件
        function openModal() {
            modalContainer.classList.add('active');
        }
        function closeModal() {
            modalContainer.classList.remove('active');
        }

        floatBtn.addEventListener('click', openModal);
        document.getElementById('yt-filter-close-btn').addEventListener('click', closeModal);
        document.getElementById('yt-filter-confirm-btn').addEventListener('click', closeModal);

        modalContainer.addEventListener('click', (e) => {
            if (e.target === modalContainer) {
                closeModal();
            }
        });

        // 监听开关变化并实时更新与保存
        const bindSwitch = (id, key) => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', (e) => {
                    currentConfig[key] = e.target.checked;
                    saveConfig(currentConfig);
                    updateStyles();

                    if (key === 'showFloatingBtn') {
                        floatBtn.style.display = currentConfig.showFloatingBtn ? 'flex' : 'none';
                    }
                });
            }
        };

        bindSwitch('cfg-blockShorts', 'blockShorts');
        bindSwitch('cfg-blockLive', 'blockLive');
        bindSwitch('cfg-blockGaming', 'blockGaming');
        bindSwitch('cfg-blockVideos', 'blockVideos');
        bindSwitch('cfg-blockPosts', 'blockPosts');
        bindSwitch('cfg-showFloatingBtn', 'showFloatingBtn');

        // 暴露全局唤醒方法供菜单命令调用
        window.openYTFilterSettings = openModal;
    }

    // ==========================================
    // 注册篡改猴 (Tampermonkey) 扩展菜单命令
    // ==========================================
    if (typeof GM_registerMenuCommand === 'function') {
        GM_registerMenuCommand('⚙️ 打开过滤器设置面板', () => {
            if (window.openYTFilterSettings) {
                window.openYTFilterSettings();
            } else {
                setupSettingsUI();
                window.openYTFilterSettings && window.openYTFilterSettings();
            }
        });

        GM_registerMenuCommand(`📱 切换 Shorts 屏蔽: ${currentConfig.blockShorts ? '【已开启】' : '【已关闭】'}`, () => {
            currentConfig.blockShorts = !currentConfig.blockShorts;
            saveConfig(currentConfig);
            updateStyles();
            location.reload();
        });

        GM_registerMenuCommand(`🔴 切换 直播 屏蔽: ${currentConfig.blockLive ? '【已开启】' : '【已关闭】'}`, () => {
            currentConfig.blockLive = !currentConfig.blockLive;
            saveConfig(currentConfig);
            updateStyles();
            location.reload();
        });

        GM_registerMenuCommand(`🎮 切换 游戏板块 屏蔽: ${currentConfig.blockGaming ? '【已开启】' : '【已关闭】'}`, () => {
            currentConfig.blockGaming = !currentConfig.blockGaming;
            saveConfig(currentConfig);
            updateStyles();
            location.reload();
        });

        GM_registerMenuCommand(`🎬 切换 常规视频 屏蔽: ${currentConfig.blockVideos ? '【已开启】' : '【已关闭】'}`, () => {
            currentConfig.blockVideos = !currentConfig.blockVideos;
            saveConfig(currentConfig);
            updateStyles();
            location.reload();
        });
    }

})();
