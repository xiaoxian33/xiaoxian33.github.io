/* ============================================================
   东魏轻松的芹菜的个人小站 · 交互脚本（JavaScript）
   ------------------------------------------------------------
   这个文件负责"行为"：点导航切页面、按 ↑ + ← 弹密码框、调后端接口。
   页面长什么样是 style.css 管；文字和结构是 index.html 管。

   目前帖子列表是空的（假数据已按要求删除）。
   等接上后端后，把下面的 POSTS 换成从数据库取数据即可，渲染逻辑不用改。
   ============================================================ */

(function () {
  'use strict';

  /* ---------------------- 帖子数据 ---------------------- */
  // 之前占位的假帖子已按要求删除。
  // 等接上后端（Spring Boot + MySQL）后，这里改成从接口取数据，
  // 下面的渲染 / 分页逻辑完全不用改。
  var POSTS = [];

  var PAGE_SIZE = 4;

  /* ---------------------- 小工具 ---------------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function postHTML(p) {
    return '<a class="post" href="#posts">' +
      '<div class="post__meta"><span class="post__date">' + esc(p.date) + '</span></div>' +
      '<h3 class="post__title">' + esc(p.title) + '</h3>' +
      '<p class="post__excerpt">' + esc(p.excerpt) + '</p>' +
      '<div class="post__tags">' + p.tags.map(function (t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</div>' +
      '</a>';
  }

  /* ---------------------- 翻译官：后端的 Post → 页面要的样子 ---------------------- */
  // 后端给的字段和页面想要的【对不上】，所以在中间加这一层转换。
  //
  //   后端 Post 返回          页面 postHTML 想要
  //   --------------------    -------------------------
  //   publishedAt             date          （名字不同）
  //   body（全文）             excerpt       （页面只要摘要）
  //   tags: "学习,Java"       tags: ["学习","Java"]   （字符串 → 数组）
  //
  // 好处：转换只在这一处做，postHTML() 一行都不用改。
  function makeExcerpt(body, max) {
    // \s+ 匹配任意连续空白（空格 / 换行 / Tab），先压成一个空格，再截断
    var text = String(body || '').replace(/\s+/g, ' ').trim();
    var limit = max || 80;
    return text.length > limit ? text.slice(0, limit) + '…' : text;
  }

  function postFromApi(p) {
    return {
      date: String(p.publishedAt || '').replace(/-/g, ' · '),  // 2026-09-12 → 2026 · 09 · 12
      title: p.title || '(无标题)',
      excerpt: makeExcerpt(p.body),
      // "学习, Java" → ["学习","Java"]
      // split 切 → map 去空格 → filter(Boolean) 丢掉空字符串（比如 "a,,b" 里的那个空）
      tags: String(p.tags || '')
        .split(',')
        .map(function (t) { return t.trim(); })
        .filter(Boolean)
    };
  }

  /* ---------------------- 列表 + 分页 ---------------------- */
  var state = { home: 1, all: 1 };

  function mountList(listId, pagerId, key) {
    var listEl = document.getElementById(listId);
    var pagerEl = document.getElementById(pagerId);
    if (!listEl || !pagerEl) return null;

    function draw() {
      // ⚠️ 总页数必须写在 draw【里面】
      // 因为 POSTS 一开始是空的，等接口数据到了才有内容。
      // 如果写在函数外面，它只会在"挂载的那一刻"算一次 —— 那样永远只有 1 页。
      var totalPages = Math.max(1, Math.ceil(POSTS.length / PAGE_SIZE));

      if (!POSTS.length) {
        listEl.innerHTML = '<div class="empty"><span class="empty__mark">♡</span>这里还没有帖子<br />等站长发第一条</div>';
        pagerEl.innerHTML = '';
        return;
      }

      var page = Math.min(Math.max(state[key], 1), totalPages);
      state[key] = page;

      listEl.innerHTML = POSTS
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .map(postHTML)
        .join('');

      var html = '<button type="button" data-page="' + (page - 1) + '"' + (page === 1 ? ' disabled' : '') + '>‹</button>';
      for (var i = 1; i <= totalPages; i += 1) {
        html += '<button type="button" data-page="' + i + '"' + (i === page ? ' class="is-active"' : '') + '>' + i + '</button>';
      }
      html += '<button type="button" data-page="' + (page + 1) + '"' + (page === totalPages ? ' disabled' : '') + '>›</button>';
      html += '<span class="pager__info">第 ' + page + ' / ' + totalPages + ' 页 · 共 ' + POSTS.length + ' 条</span>';
      pagerEl.innerHTML = html;
    }

    pagerEl.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-page]');
      if (!btn || btn.disabled) return;
      state[key] = Number(btn.dataset.page);
      draw();
      listEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    draw();

    // 把这个"重画"的能力交出去 —— 接口数据到了以后要再画一次
    return draw;
  }

  /* ---------------------- 页面切换 ---------------------- */
  var NAV_TITLES = {
    edu: '教育经历',
    hobby: '兴趣爱好',
    skill: '专业技能',
    projects: '做过的项目',
    essay: '随笔',
    ai: 'AI 分身'
  };

  function switchView(view, title) {
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i += 1) views[i].classList.remove('is-active');

    var target = document.getElementById('view-' + view);
    if (target) target.classList.add('is-active');

    var items = document.querySelectorAll('.nav__item');
    for (var j = 0; j < items.length; j += 1) {
      items[j].classList.toggle('is-active', items[j].dataset.view === view);
    }

    if (view === 'placeholder') {
      var t = document.getElementById('blankTitle');
      if (t) t.textContent = (title || '这一页') + ' 还在施工';
    }

    window.scrollTo(0, 0);
  }

  /* ---------------------- 事件绑定 ---------------------- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('[data-view]');
    if (!link) return;
    e.preventDefault();

    var view = link.dataset.view;
    if (document.getElementById('view-' + view)) {
      switchView(view);                                   // 这个页面已经做好了
    } else {
      switchView('placeholder', NAV_TITLES[view] || '这一页');   // 还没做 → 占位页
    }
    if (history.replaceState) history.replaceState(null, '', '#' + view);
  });

  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
  }

  /* ---------------------- 隐藏入口：↑ + ← 同时按住 ---------------------- */
  // ⚠️ 说清楚：这只是「门帘」，不是锁。
  //    写在网页里的密码，任何人查看源码都能看到 —— 所以现在里面没有任何真数据。
  //    等接上后端，密码会放到服务器上校验，那时才算真的锁。
  var ADMIN_PASSWORD = 'admin123';   // ← 临时密码，改这一行就能换

  var gate = document.getElementById('gate');
  var gateBox = document.getElementById('gateBox');
  var gateInput = document.getElementById('gateInput');
  var ownerPanel = document.getElementById('ownerPanel');
  var rootBadge = document.getElementById('rootBadge');
  var heldKeys = Object.create(null);

  function openGate() {
    if (!gate || !gate.hidden) return;
    gate.hidden = false;
    gateInput.value = '';
    setTimeout(function () { gateInput.focus(); }, 0);
  }

  function closeGate() {
    if (gate) gate.hidden = true;
  }

  function enterOwnerMode() {
    closeGate();
    document.body.classList.add('owner-mode');
    if (ownerPanel) ownerPanel.hidden = false;
    if (rootBadge) rootBadge.hidden = false;
  }

  function exitOwnerMode() {
    document.body.classList.remove('owner-mode');
    if (ownerPanel) ownerPanel.hidden = true;
    if (rootBadge) rootBadge.hidden = true;
  }

  function submitPassword() {
    if ((gateInput.value || '').trim() === ADMIN_PASSWORD) { enterOwnerMode(); return; }
    // 失败时什么都不说，只是抖一下（陌生人看了也以为是个坏掉的小弹窗）
    gateBox.classList.add('is-shake');
    setTimeout(function () { gateBox.classList.remove('is-shake'); }, 420);
    gateInput.value = '';
    gateInput.focus();
  }

  document.addEventListener('keydown', function (e) {
    if (gate && !gate.hidden) {
      if (e.key === 'Enter') { e.preventDefault(); submitPassword(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeGate(); }
      return;
    }
    var el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) return;

    heldKeys[e.key] = true;
    if (heldKeys.ArrowUp && heldKeys.ArrowLeft) { e.preventDefault(); openGate(); }
  });

  document.addEventListener('keyup', function (e) { heldKeys[e.key] = false; });
  window.addEventListener('blur', function () { heldKeys = Object.create(null); });

  var gateOk = document.getElementById('gateOk');
  var gateCancel = document.getElementById('gateCancel');
  var ownerExit = document.getElementById('ownerExit');
  if (gateOk) gateOk.addEventListener('click', submitPassword);
  if (gateCancel) gateCancel.addEventListener('click', closeGate);
  if (ownerExit) ownerExit.addEventListener('click', exitOwnerMode);
  if (gate) gate.addEventListener('click', function (e) { if (e.target === gate) closeGate(); });

  /* ---------------------- 第 2 步：让网页去调后端 ---------------------- */
  // 后端地址：现在它跑在你自己的电脑上，所以是 localhost。
  // 以后把后端部署到服务器，只需要改这一行。
  var API_BASE = 'http://localhost:8080';

  var apiStatusEl = document.getElementById('apiStatus');

  function setApiStatus(text, ok) {
    if (!apiStatusEl) return;
    apiStatusEl.textContent = text;
    apiStatusEl.className = 'api ' + (ok ? 'api--ok' : 'api--off');
  }

  function checkBackend() {
    if (!apiStatusEl) return;
    setApiStatus('正在连接后端…', false);

    // 4 秒还没回应就算"没连上"（不然页面会一直等）
    var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = setTimeout(function () { if (controller) controller.abort(); }, 4000);

    fetch(API_BASE + '/api/hello', controller ? { signal: controller.signal } : {})
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        clearTimeout(timer);
        var t = (data.time || '').slice(11, 19);
        setApiStatus('后端已连接 · ' + (data.message || 'ok') + (t ? '（' + t + '）' : ''), true);
      })
      .catch(function () {
        clearTimeout(timer);
        setApiStatus('后端未连接 — 这是正常的，你现在没开本地后端', false);
      });
  }

  /* ---------------------- 第 3 步：「关于我」改成从数据库读 ---------------------- */
  // 思路叫「渐进增强」：
  //   ① 页面先用 HTML 里写好的内容显示 —— 后端没开也不会是一片空白
  //   ② 同时去问后端要最新资料
  //   ③ 拿到了 → 覆盖页面上的内容；没拿到 → 什么都不做，继续用旧内容
  function setText(id, value) {
    var el = document.getElementById(id);
    // 注意判空：字段是空的时候，别把页面上已有的内容清成空白
    if (el && value) el.textContent = value;
  }

  function applyProfile(p) {
    setText('heroName', p.name);
    setText('heroTagline', p.tagline);

    // 简介里带换行（\n）。但 textContent 不会把 \n 当换行，
    // 所以先转义（防止有人把 HTML 塞进数据库）再把 \n 换成 <br />。
    var intro = document.getElementById('heroIntro');
    if (intro && p.intro) intro.innerHTML = esc(p.intro).replace(/\n/g, '<br />');

    // 头像：改 <img> 的 src
    var avatar = document.getElementById('heroAvatar');
    if (avatar && p.avatarPath) avatar.src = p.avatarPath;

    // 顶部大图：CSS 里用的是 background 简写，这里只覆盖 background-image 就够
    // （位置 / 大小 / 是否重复这些仍然沿用 CSS 里的设置）
    var hero = document.getElementById('hero');
    if (hero && p.heroPath) hero.style.backgroundImage = 'url("' + p.heroPath + '")';

    // 顺手把浏览器标签页的标题也改成数据库里的名字
    if (p.name) document.title = p.name + '的个人小站';
  }

  function loadProfile() {
    fetch(API_BASE + '/api/profile')   // ① 发请求（不写就是 GET）
      .then(function (res) {
        // fetch 的"坑"：404 / 500 也算"成功响应"，不会自己跳进 catch，
        // 所以必须自己检查状态码。
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();             // ② 把响应体从"文字"解析成 JS 对象
      })
      .then(function (profile) {
        applyProfile(profile);         // ③ 拿到对象，填进页面
      })
      .catch(function (err) {
        // 后端没开是正常情况：只在控制台留一句，页面继续用 HTML 里的内容
        console.warn('[profile] 没拿到资料，继续用页面里写好的内容：', err);
      });
  }

  /* ---------------------- 第 4 步：「随笔」改成从数据库读 ---------------------- */
  // 这次接口返回的是一个【数组】（每个元素 = 一篇随笔）。
  // 所以要先把数组"加工"成一大块 HTML 文字，再一次性塞进页面。
  // 两个新工具：
  //   map(...)  把一个数组"变形"成另一个数组（一篇 → 一段 HTML 文字）
  //   join('')  把数组里的东西"粘"成一个字符串
  function essayHTML(e) {
    // 日期：数据库里是 "2025-04-23"，页面要显示成 "2025 · 04 · 23"
    // String(... || '') 是为了防 null：万一是空值，也不会报错
    var date = String(e.writtenOn || '').replace(/-/g, ' · ');

    // 正文：段落之间用空行分隔 → 先按"空行"切成数组 → 每段包一层 <p> → 再粘起来
    var paras = String(e.body || '')
      .split(/\n\s*\n/)     // 正则：\n 换行 + \s* 可能有的空格 → 也就是"空行"
      .map(function (p) { return '<p>' + esc(p.trim()) + '</p>'; })
      .join('');

    return '<article class="entry">' +
      '<div class="entry__date">' + esc(date) + '</div>' +
      '<div class="entry__body">' + paras + '</div>' +
    '</article>';
  }

  function loadEssays() {
    fetch(API_BASE + '/api/essays')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (list) {
        var box = document.getElementById('essayList');
        if (!box) return;

        // 一篇都没有 → 给一句人话，而不是留一片空白
        if (!list.length) {
          box.innerHTML = '<div class="empty"><span class="empty__mark">♡</span>还没有随笔</div>';
          return;
        }

        // innerHTML = 把里面原本的 HTML 全部换掉
        box.innerHTML = list.map(essayHTML).join('');
      })
      .catch(function (err) {
        // 请求失败时【不覆盖】页面 —— 让 HTML 里写好的旧内容继续顶着
        console.warn('[essays] 没拿到随笔，继续用页面里写好的内容：', err);
      });
  }

  /* ---------------------- 第 5 步：「发帖」改成从数据库读 ---------------------- */
  function loadPosts() {
    fetch(API_BASE + '/api/posts')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (list) {
        POSTS = list.map(postFromApi);   // 先翻译，再交给原来那套渲染逻辑
        if (drawHome) drawHome();        // 重画首页的「近期发帖」
        if (drawAll) drawAll();          // 重画「发帖」页
      })
      .catch(function (err) {
        // 拿不到就保持空列表 → 页面会显示"这里还没有帖子"
        console.warn('[posts] 没拿到帖子：', err);
      });
  }

  /* ---------------------- 启动 ---------------------- */
  // mountList 现在会返回一个"重画函数"，接住它，等数据到了再画一次
  var drawHome = mountList('postListHome', 'pagerHome', 'home');
  var drawAll = mountList('postListAll', 'pagerAll', 'all');
  checkBackend();
  loadProfile();
  loadEssays();
  loadPosts();

  // 支持用地址栏的 #home / #posts / #hobby 直接进来
  var hash = (location.hash || '').replace('#', '');
  if (hash && hash !== 'home') {
    if (document.getElementById('view-' + hash)) switchView(hash);
    else switchView('placeholder', NAV_TITLES[hash] || '这一页');
  }
})();
