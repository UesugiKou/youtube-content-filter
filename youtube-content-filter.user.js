// ==UserScript==
// @name         YouTube 内容过滤器 (Shorts/直播/视频/游戏/合辑/精选)
// @name:en      YouTube Content Filter (Shorts/Live/Videos/Gaming/Mix/Featured)
// @namespace    https://github.com/UesugiKou/youtube-content-filter
// @version      1.2.0
// @description  便捷分别屏蔽 YouTube 上的 Shorts 短视频、直播内容、常规视频、游戏板块、YouTube自动合辑(Mix)与YouTube精选推广视频，支持流式自动补全与可视化设置面板。
// @author       UesugiKou
// @match        https://www.youtube.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// @license      MIT
// @updateURL    https://UesugiKou.github.io/youtube-content-filter/youtube-content-filter.user.js
// @downloadURL  https://UesugiKou.github.io/youtube-content-filter/youtube-content-filter.user.js
// ==/UserScript==

(function () {
    'use strict';

    // 默认配置
    const DEFAULT_CONFIG = {
        blockShorts: true,       // 屏蔽 Shorts
        blockLive: false,        // 屏蔽 直播
        blockGaming: true,       // 屏蔽 游戏板块
        blockMix: true,          // 屏蔽 YouTube Mix / 自动合辑 (独立拆分)
        blockFeatured: true,     // 屏蔽 YouTube 精选 / 推广 (独立拆分)
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
                blockMix: GM_getValue('blockMix', DEFAULT_CONFIG.blockMix),
                blockFeatured: GM_getValue('blockFeatured', DEFAULT_CONFIG.blockFeatured),
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
        let css = `
            /* 修复网格布局：将行容器展开为 contents，隐藏项不占据网格单元，消除大片空白与空行 */
            ytd-rich-grid-row,
            ytd-rich-grid-row #contents {
                display: contents !important;
            }

            /* 隐藏全空或已标记过滤的 Section/Shelf，消除垂直间隙空白 */
            ytd-rich-section-renderer:empty,
            ytd-rich-shelf-renderer:empty,
            ytd-rich-section-renderer[data-yt-filter-type],
            ytd-rich-shelf-renderer[data-yt-filter-type] {
                display: none !important;
            }

            /* 保持 continuation 加载锚点高度，确保 IntersectionObserver 可被可靠唤醒 */
            ytd-continuation-item-renderer,
            yt-continuation-item-renderer {
                display: block !important;
                min-height: 36px !important;
            }
        `;

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

        // 4. 屏蔽 YouTube Mix / 自动合辑 (Mixes & Radio) 规则
        if (cfg.blockMix) {
            css += `
                /* 首页/信息流/推荐流中的 YouTube 自动生成 Mix / 音乐电台与合辑卡片 */
                ytd-rich-item-renderer:has(a[href*="start_radio=1"]),
                ytd-rich-item-renderer:has(a[href*="list=RD"]),
                ytd-rich-item-renderer:has(ytd-radio-renderer),
                ytd-rich-item-renderer:has(ytd-compact-radio-renderer),
                ytd-video-renderer:has(a[href*="start_radio=1"]),
                ytd-video-renderer:has(a[href*="list=RD"]),
                ytd-video-renderer:has(ytd-radio-renderer),
                ytd-compact-video-renderer:has(a[href*="start_radio=1"]),
                ytd-compact-video-renderer:has(a[href*="list=RD"]),
                ytd-compact-video-renderer:has(ytd-radio-renderer),
                ytd-grid-video-renderer:has(a[href*="start_radio=1"]),
                ytd-grid-video-renderer:has(a[href*="list=RD"]),
                ytd-radio-renderer,
                ytd-compact-radio-renderer,
                .ytp-videowall-still[data-is-mix="true"],
                /* 备用标记属性选择器 */
                [data-yt-filter-type="mix"] {
                    display: none !important;
                }
            `;
        }

        // 5. 屏蔽 YouTube 精选 (Featured / 带有 YouTube精选 标签的疑似推广推荐) 规则
        if (cfg.blockFeatured) {
            css += `
                /* 首页/信息流中的 YouTube 精选专区与货架 */
                ytd-rich-section-renderer:has(#featured-badge),
                ytd-rich-shelf-renderer:has(#featured-badge),
                /* 带有“YouTube精选”标签/徽标的单个推荐/推广视频卡片 */
                ytd-rich-item-renderer:has(#featured-badge),
                ytd-video-renderer:has(#featured-badge),
                ytd-compact-video-renderer:has(#featured-badge),
                ytd-grid-video-renderer:has(#featured-badge),
                ytd-rich-item-renderer:has([overlay-style="FEATURED"]),
                ytd-rich-item-renderer:has(.badge-style-type-featured),
                ytd-video-renderer:has(.badge-style-type-featured),
                ytd-compact-video-renderer:has(.badge-style-type-featured),
                ytd-grid-video-renderer:has(.badge-style-type-featured),
                ytd-rich-item-renderer:has(ytd-badge-supported-renderer [aria-label*="精选" i]),
                ytd-rich-item-renderer:has(ytd-badge-supported-renderer [aria-label*="精選" i]),
                ytd-rich-item-renderer:has(ytd-badge-supported-renderer [aria-label*="Featured" i]),
                ytd-video-renderer:has(ytd-badge-supported-renderer [aria-label*="精选" i]),
                ytd-video-renderer:has(ytd-badge-supported-renderer [aria-label*="精選" i]),
                ytd-video-renderer:has(ytd-badge-supported-renderer [aria-label*="Featured" i]),
                /* 推广与赞助商广告槽位卡片 */
                ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
                ytd-rich-item-renderer:has(ytd-in-feed-ad-layout-renderer),
                ytd-rich-item-renderer:has(ytd-display-ad-renderer),
                ytd-video-renderer:has(ytd-ad-slot-renderer),
                ytd-video-renderer:has(ytd-in-feed-ad-layout-renderer),
                ytd-video-renderer:has(ytd-display-ad-renderer),
                /* 备用标记属性选择器 */
                [data-yt-filter-type="featured"] {
                    display: none !important;
                }
            `;
        }

        // 6. 屏蔽 常规长视频 规则 (通常用于只浏览社区、特定专区或极致防沉迷)
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

        // 7. 屏蔽 社区动态与合辑
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
            if (node.tagName === 'YTD-RICH-ITEM-RENDERER' || node.tagName === 'YTD-VIDEO-RENDERER' || node.tagName === 'YTD-COMPACT-VIDEO-RENDERER' || node.tagName === 'YTD-GRID-VIDEO-RENDERER') {
                const hasShortsLink = node.querySelector('a[href*="/shorts"]');
                if (hasShortsLink) {
                    node.setAttribute('data-yt-filter-type', 'shorts');
                    return;
                }
            }
            if (node.tagName === 'YTD-REEL-SHELF-RENDERER' || (node.tagName === 'YTD-RICH-SHELF-RENDERER' && node.hasAttribute('is-shorts'))) {
                node.setAttribute('data-yt-filter-type', 'shorts');
                const parentSection = node.closest('ytd-rich-section-renderer');
                if (parentSection) parentSection.setAttribute('data-yt-filter-type', 'shorts');
                return;
            }
        }

        // 标记 直播
        if (currentConfig.blockLive) {
            const hasLiveBadge = node.querySelector && node.querySelector('[overlay-style="LIVE"], .badge-style-type-live-now, .badge-style-type-live-now-alternate, [aria-label*="LIVE" i], [aria-label*="直播" i]');
            if (hasLiveBadge) {
                if (node.tagName === 'YTD-RICH-ITEM-RENDERER' || node.tagName === 'YTD-VIDEO-RENDERER' || node.tagName === 'YTD-COMPACT-VIDEO-RENDERER' || node.tagName === 'YTD-GRID-VIDEO-RENDERER') {
                    node.setAttribute('data-yt-filter-type', 'live');
                    return;
                }
            }
        }

        // 标记 游戏专区货架
        if (currentConfig.blockGaming) {
            if (node.tagName === 'YTD-RICH-SECTION-RENDERER' || node.tagName === 'YTD-RICH-SHELF-RENDERER') {
                const hasGamingLink = node.querySelector('a[href*="/gaming"], a[href^="/channel/UCOpNcN46UbXVtpKMrmU4Abg"]');
                if (hasGamingLink) {
                    node.setAttribute('data-yt-filter-type', 'gaming');
                    const parentSection = node.closest('ytd-rich-section-renderer');
                    if (parentSection) parentSection.setAttribute('data-yt-filter-type', 'gaming');
                    return;
                }
            }
        }

        // 标记 YouTube Mix / 自动合辑 (Mixes & Radio)
        if (currentConfig.blockMix) {
            if (node.tagName === 'YTD-RICH-ITEM-RENDERER' || node.tagName === 'YTD-VIDEO-RENDERER' || node.tagName === 'YTD-COMPACT-VIDEO-RENDERER' || node.tagName === 'YTD-GRID-VIDEO-RENDERER') {
                const hasMix = node.querySelector('a[href*="start_radio=1"], a[href*="list=RD"], ytd-radio-renderer, ytd-compact-radio-renderer');
                if (hasMix) {
                    node.setAttribute('data-yt-filter-type', 'mix');
                    return;
                }
                const overlay = node.querySelector('ytd-thumbnail-overlay-bottom-panel-renderer, ytd-thumbnail-overlay-side-panel-renderer');
                if (overlay && /合[辑輯]|Mix/i.test(overlay.textContent || '')) {
                    node.setAttribute('data-yt-filter-type', 'mix');
                    return;
                }
            }
            if (node.tagName === 'YTD-RADIO-RENDERER' || node.tagName === 'YTD-COMPACT-RADIO-RENDERER') {
                node.setAttribute('data-yt-filter-type', 'mix');
                return;
            }
        }

        // 标记 YouTube 精选 (带有 YouTube精选 标签的推广/推荐视频或货架)
        if (currentConfig.blockFeatured) {
            // 货架专区检查
            if (node.tagName === 'YTD-RICH-SECTION-RENDERER' || node.tagName === 'YTD-RICH-SHELF-RENDERER') {
                const titleEl = node.querySelector('#title-container, #title, #title-text, yt-formatted-string#title, h2');
                const titleText = titleEl ? titleEl.textContent.trim() : '';
                const hasFeaturedBmp = node.querySelector('#featured-badge, [aria-label*="Featured" i], [aria-label*="精选" i], [aria-label*="精選" i]');
                if (hasFeaturedBmp || /YouTube\s*精[选選]|精[选選]|Featured|Spotlight/i.test(titleText)) {
                    node.setAttribute('data-yt-filter-type', 'featured');
                    const parentSection = node.closest('ytd-rich-section-renderer');
                    if (parentSection) parentSection.setAttribute('data-yt-filter-type', 'featured');
                    return;
                }
            }

            // 单个视频卡片检查（检查 YouTube精选 徽标、推广槽位等）
            if (node.tagName === 'YTD-RICH-ITEM-RENDERER' || node.tagName === 'YTD-VIDEO-RENDERER' || node.tagName === 'YTD-COMPACT-VIDEO-RENDERER' || node.tagName === 'YTD-GRID-VIDEO-RENDERER') {
                const hasFeaturedBmp = node.querySelector('#featured-badge, [overlay-style="FEATURED"], .badge-style-type-featured, [aria-label*="YouTube 精选" i], [aria-label*="YouTube精选" i]');
                if (hasFeaturedBmp) {
                    node.setAttribute('data-yt-filter-type', 'featured');
                    return;
                }

                // 检查推广/广告槽位
                if (node.querySelector('ytd-ad-slot-renderer, ytd-in-feed-ad-layout-renderer, ytd-display-ad-renderer')) {
                    node.setAttribute('data-yt-filter-type', 'featured');
                    return;
                }

                // 深度遍历所有徽标标签文本
                const badges = node.querySelectorAll('ytd-badge-supported-renderer, .badge, #badges, badge-shape-wiz, .badge-shape-wiz__text');
                for (const b of badges) {
                    const text = (b.textContent || '').trim();
                    if (/YouTube\s*精[选選]|精[选選]|Featured/i.test(text)) {
                        node.setAttribute('data-yt-filter-type', 'featured');
                        return;
                    }
                }
            }
        }
    }

    // ==========================================
    // 视频流自动补充与无缝无限滚动引擎
    // 解决开启多个过滤后页面高度骤降、continuation 停滞不触发导致滚动卡死与大片空白的问题
    // ==========================================
    let consecutiveFetches = 0;
    const MAX_CONSECUTIVE_FETCHES = 8;
    let lastStreamAdjustTime = 0;
    let lastVisibleCount = 0;

    function checkAndAdjustStream() {
        const continuation = document.querySelector('ytd-continuation-item-renderer, yt-continuation-item-renderer');
        if (!continuation) return;

        // 检查是否已经在加载中
        const spinner = continuation.querySelector('tp-yt-paper-spinner, tp-yt-paper-spinner-lite, paper-spinner, .tp-yt-paper-spinner');
        const isSpinnerActive = spinner && (spinner.hasAttribute('active') || spinner.classList.contains('active'));
        const isStateLoading = continuation.getAttribute('state') === 'loading';
        if (isSpinnerActive || isStateLoading) {
            return;
        }

        // 计算视口与滚动距离
        const rect = continuation.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const scrollRemaining = scrollHeight - (scrollY + windowHeight);

        // 判定是否需要自动续订拉取：
        // 1. continuation 元素进入视口或距离视口下沿不足 800px
        // 2. 或者触底（剩余可滚动高度小于 1000px）
        // 3. 或者页面总高度过短（不足以填满屏幕）
        const isContinuationNear = rect.top <= (windowHeight + 800) && rect.bottom >= -300;
        const isNearBottom = scrollRemaining < 1000;
        const isShortPage = scrollHeight <= (windowHeight + 300);

        if (isContinuationNear || isNearBottom || isShortPage) {
            const now = Date.now();
            if (now - lastStreamAdjustTime < 350) return; // 节流控制
            if (consecutiveFetches >= MAX_CONSECUTIVE_FETCHES) return; // 避免极端无限死循环

            lastStreamAdjustTime = now;
            consecutiveFetches++;

            // 1. 如果存在显式的“加载更多”按钮，直接点击
            const loadMoreBtn = continuation.querySelector('button, #button button, yt-button-shape button');
            if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
                try { loadMoreBtn.click(); } catch (e) {}
            }

            // 2. 唤醒 YouTube 绑定的 IntersectionObserver：
            // 因为隐藏卡片导致页面变矮，continuation 从未离开视口因而无法产生 intersection 事件。
            // 瞬时切换 display 迫使浏览器重新计算 layout 并触发 isIntersecting 事件通知
            const prevDisplay = continuation.style.display;
            continuation.style.display = 'none';
            requestAnimationFrame(() => {
                continuation.style.display = prevDisplay || '';

                // 3. 辅助派发滚动事件并微调滚动位置唤醒内部监听
                window.dispatchEvent(new Event('scroll'));
                document.dispatchEvent(new Event('scroll'));

                if (window.scrollY > 0) {
                    window.scrollBy(0, -1);
                    window.scrollBy(0, 1);
                }
            });

            // 4. 尝试直接调用 Polymer 内部可能存在的方法
            if (typeof continuation.onIntersection === 'function') {
                try { continuation.onIntersection(); } catch (e) {}
            }
        }
    }

    // 监听滚轮与触摸事件，当用户主动向下滑动时立刻重置计数并检查流
    window.addEventListener('wheel', (e) => {
        if (e.deltaY > 0) {
            consecutiveFetches = 0;
            checkAndAdjustStream();
        }
    }, { passive: true });

    window.addEventListener('touchmove', () => {
        consecutiveFetches = 0;
        checkAndAdjustStream();
    }, { passive: true });

    // 页面滚动监听（节流）
    let scrollThrottleTimer = null;
    window.addEventListener('scroll', () => {
        if (scrollThrottleTimer) return;
        scrollThrottleTimer = setTimeout(() => {
            scrollThrottleTimer = null;
            checkAndAdjustStream();
        }, 150);
    }, { passive: true });

    // SPA 页面跳转与加载完成事件
    window.addEventListener('yt-navigate-finish', () => {
        consecutiveFetches = 0;
        lastVisibleCount = 0;
        updateStyles();
        setTimeout(checkAndAdjustStream, 500);
    });

    // 轻量级节流观察器
    let mutationTimer = null;
    const observer = new MutationObserver((mutations) => {
        if (mutationTimer) return;
        mutationTimer = setTimeout(() => {
            mutationTimer = null;
            const items = document.querySelectorAll(
                'ytd-rich-section-renderer:not([data-yt-filter-type]), ' +
                'ytd-rich-shelf-renderer:not([data-yt-filter-type]), ' +
                'ytd-rich-item-renderer:not([data-yt-filter-type]), ' +
                'ytd-video-renderer:not([data-yt-filter-type]), ' +
                'ytd-compact-video-renderer:not([data-yt-filter-type]), ' +
                'ytd-grid-video-renderer:not([data-yt-filter-type]), ' +
                'ytd-radio-renderer:not([data-yt-filter-type]), ' +
                'ytd-compact-radio-renderer:not([data-yt-filter-type])'
            );
            items.forEach(scanAndMarkItem);

            // 统计当前有效显示的视频卡片数，如有新增则重置连续拉取计数
            const visibleItems = document.querySelectorAll('ytd-rich-item-renderer:not([data-yt-filter-type])');
            if (visibleItems.length > lastVisibleCount) {
                lastVisibleCount = visibleItems.length;
                consecutiveFetches = 0;
            }

            // 扫描过滤后自动检查并调整流，补充足够的内容以填补空缺
            checkAndAdjustStream();
        }, 200);
    });

    // 页面加载完成后启动 MutationObserver 与 UI 创建
    document.addEventListener('DOMContentLoaded', () => {
        updateStyles();
        observer.observe(document.body, { childList: true, subtree: true });
        setupSettingsUI();
        setTimeout(checkAndAdjustStream, 800);
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
                            <span class="yt-filter-name">🔀 屏蔽 YouTube Mix / 自动合辑</span>
                            <span class="yt-filter-desc">隐藏官方自动生成的歌曲合辑 (Mixes/Radio)、播放列表推荐与合集卡片</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockMix" ${currentConfig.blockMix ? 'checked' : ''}>
                            <span class="yt-filter-slider"></span>
                        </label>
                    </div>

                    <div class="yt-filter-item">
                        <div class="yt-filter-label">
                            <span class="yt-filter-name">✨ 屏蔽 YouTube精选 (推广推荐)</span>
                            <span class="yt-filter-desc">隐藏带有“YouTube精选”标签的疑似推广视频、精选徽标推荐及精选专区货架</span>
                        </div>
                        <label class="yt-filter-switch">
                            <input type="checkbox" id="cfg-blockFeatured" ${currentConfig.blockFeatured ? 'checked' : ''}>
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
                            <span class="yt-filter-name">📰 屏蔽 社区动态与图文帖子</span>
                            <span class="yt-filter-desc">隐藏首页与推荐流中的粉丝投票、社区图文动态帖子与播放列表合集</span>
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

                    // 配置变化后触发一次视频流检查，以防当前可见区域卡住
                    checkAndAdjustStream();
                });
            }
        };

        bindSwitch('cfg-blockShorts', 'blockShorts');
        bindSwitch('cfg-blockLive', 'blockLive');
        bindSwitch('cfg-blockGaming', 'blockGaming');
        bindSwitch('cfg-blockMix', 'blockMix');
        bindSwitch('cfg-blockFeatured', 'blockFeatured');
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

        GM_registerMenuCommand(`🔀 切换 Mix合辑 屏蔽: ${currentConfig.blockMix ? '【已开启】' : '【已关闭】'}`, () => {
            currentConfig.blockMix = !currentConfig.blockMix;
            saveConfig(currentConfig);
            updateStyles();
            location.reload();
        });

        GM_registerMenuCommand(`✨ 切换 YouTube精选 屏蔽: ${currentConfig.blockFeatured ? '【已开启】' : '【已关闭】'}`, () => {
            currentConfig.blockFeatured = !currentConfig.blockFeatured;
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
