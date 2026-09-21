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

  // 后端原样的数据（没翻译过的）—— 编辑时要靠它把内容回填到表单里
  var RAW_POSTS = [];
  var ESSAYS = [];

  // 最近一次从后端拿到的资料（"我的资料"表单要用它回填，避免空表单把资料清空）
  var currentProfile = null;

  var PAGE_SIZE = 4;

  /* ---------------------- 小工具 ---------------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function postHTML(p) {
    return '<div class="post-wrap">' +
      // data-open-post = 这张卡片的身份。点击的判定在下面的"事件委托"里统一处理 ✓
      '<a class="post" href="#posts" data-open-post="' + p.id + '" title="点开看全文">' +
        '<div class="post__meta"><span class="post__date">' + esc(p.date) + '</span></div>' +
        '<h3 class="post__title">' + esc(p.title) + '</h3>' +
        '<p class="post__excerpt">' + esc(p.excerpt) + '</p>' +
        // 有图就把图排出来（图片地址在 postFromApi 里已经翻译成完整网址了）
        (p.images && p.images.length
          ? '<div class="post__images">' + p.images.map(function (src) {
              return '<img src="' + esc(src) + '" alt="" loading="lazy" />';
            }).join('') + '</div>'
          : '') +
        '<div class="post__tags">' + p.tags.map(function (t) { return '<span>#' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="post__more">点击阅读全文 ›</div>' +
      '</a>' +
      // ✏️🗑️ 只有站长看得见（靠 body.owner-mode 控制显隐），点它们不会触发卡片跳转
      '<div class="item-actions">' +
        '<button type="button" class="iconbtn" data-edit-post="' + p.id + '" title="改这条">✏️</button>' +
        '<button type="button" class="iconbtn iconbtn--danger" data-del-post="' + p.id + '" title="删这条">🗑️</button>' +
      '</div>' +
    '</div>';
  }

  /* ---------------------- 📖 帖子详情弹窗 + 🔍 图片放大 ---------------------- */

  var postModal = document.getElementById('postModal');
  var lightbox  = document.getElementById('lightbox');

  // 正文分段：和随笔一样 —— 段落之间空一行就分段 ✓（单个换行也保留 ✓）
  function bodyToParas(text) {
    return String(text || '')
      .split(/\n\s*\n/)
      .map(function (p) { return '<p>' + esc(p.trim()).replace(/\n/g, '<br />') + '</p>'; })
      .join('');
  }

  function openPostModal(id) {
    var raw = findRawPost(Number(id));
    if (!raw || !postModal) return;

    var date = String(raw.publishedAt || '').replace(/-/g, ' · ');
    document.getElementById('postModalDate').textContent = date;
    document.getElementById('postModalTitle').textContent = raw.title || '(无标题)';
    document.getElementById('postModalBody').innerHTML = bodyToParas(raw.body);

    document.getElementById('postModalImages').innerHTML = (raw.images || []).map(function (src) {
      return '<img src="' + esc(imgUrl(src)) + '" alt="" data-zoom="1" loading="lazy" />';
    }).join('');

    document.getElementById('postModalTags').innerHTML =
      String(raw.tags || '').split(',')
        .map(function (t) { return t.trim(); })
        .filter(Boolean)
        .map(function (t) { return '<span>#' + esc(t) + '</span>'; })
        .join('');

    postModal.hidden = false;
    document.body.classList.add('postmodal-open');
  }

  function closePostModal() {
    if (postModal) postModal.hidden = true;
    document.body.classList.remove('postmodal-open');
  }

  function openLightbox(src) {
    if (!lightbox || !src) return;
    document.getElementById('lightboxImg').src = src;
    lightbox.hidden = false;
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.getElementById('lightboxImg').src = '';
  }

  // 点击统一处理（事件委托）：卡片 / 图片 / 空白处
  document.addEventListener('click', function (e) {
    // ① 点帖子卡片 → 开弹窗（点在卡片上的 ✏️ / 🗑️ 时不算 ✓）
    var card = e.target.closest('[data-open-post]');
    if (card && !e.target.closest('[data-edit-post], [data-del-post]')) {
      e.preventDefault();
      openPostModal(card.dataset.openPost);
      return;
    }

    // ② 点图片 → 放大
    var zoom = e.target.closest('[data-zoom]');
    if (zoom) { e.preventDefault(); openLightbox(zoom.getAttribute('src')); return; }

    // ③ 点放大层任意处 → 收起
    if (e.target === lightbox) { closeLightbox(); return; }

    // ④ 点弹窗外面的灰色区域 → 关弹窗
    if (e.target === postModal) { closePostModal(); return; }
  });

  var modalCloseBtn = document.getElementById('postModalClose');
  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closePostModal);

  // Esc：先关放大图，再关弹窗 ✓
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (lightbox && !lightbox.hidden) { closeLightbox(); return; }
    if (postModal && !postModal.hidden) closePostModal();
  });

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

  // 后端给的图片是"相对路径"（uploads/2026/09/x.jpg），
  // 但 <img> 要的是完整地址 → 这里统一翻译一次，别处就不用再操心
  function imgUrl(path) {
    return API_BASE + '/' + String(path || '').replace(/^\/+/, '');
  }

  function postFromApi(p) {
    return {
      id: p.id,                                                  // ← 改 / 删要靠它认人
      images: (p.images || []).map(imgUrl),                       // ← 图片：相对路径 → 完整网址
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
  // ✅ 现在这里是【真的锁】了：
  //    密码不再写在这个文件里，而是发给后端校验；
  //    后端说对，才发一张「令牌」回来，前端存起来。
  //    （改这个文件也骗不过后端 —— 因为令牌只有后端能发。）

  var gate = document.getElementById('gate');
  var gateBox = document.getElementById('gateBox');
  var gateInput = document.getElementById('gateInput');
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

  /* ---------------------- 编辑器弹窗（任何页面都能叫出来）---------------------- */
  // 做法：一个浮层里放"好几屏"—— 一屏是"选择改什么"，其余是各个表单。
  // 同一时刻只显示一屏，所以不会套娃弹窗。

  var editor      = document.getElementById('editor');
  var editorFab   = document.getElementById('editorFab');
  var editorBack  = document.getElementById('editorBack');
  var editorTitle = document.getElementById('editorTitle');
  var pickView    = document.getElementById('editorPick');

  // 名字（选择题按钮上的 data-editor）→ 那一屏的元件 + 标题
  var EDITOR_SCREENS = {
    post:    { el: document.getElementById('editorPost'),    title: '📝 发一条帖子' },
    essay:   { el: document.getElementById('editorEssay'),   title: '✒️ 写一篇随笔' },
    profile: { el: document.getElementById('editorProfile'), title: '👤 我的资料' }
  };

  function openEditor() {
    if (!editor) return;
    showScreen(null);            // 每次打开都先回到"选择"那一屏
    editor.hidden = false;
  }

  function closeEditor() {
    if (editor) editor.hidden = true;
  }

  // name 传 null = 显示"选择"屏；传 'post' / 'essay' / 'profile' = 显示对应表单
  function showScreen(name) {
    for (var key in EDITOR_SCREENS) {
      if (EDITOR_SCREENS[key].el) EDITOR_SCREENS[key].el.hidden = (key !== name);
    }
    if (pickView) pickView.hidden = !!name;
    if (editorBack) editorBack.hidden = !name;
    if (editorTitle) editorTitle.textContent = name ? EDITOR_SCREENS[name].title : '你要编辑哪一部分？';

    if (name === 'profile') fillProfileForm();     // 资料表单要回填现有内容

    if (name) {                                   // 进表单时，把光标放进第一个输入框
      var first = EDITOR_SCREENS[name].el.querySelector('input, textarea');
      if (first) first.focus();
    }
  }

  /* ---------------------- 底部的小提示条 ---------------------- */
  var toastEl = document.getElementById('toast');
  var toastTimer = null;

  function showToast(text, bad) {
    if (!toastEl) return;
    toastEl.textContent = text;
    toastEl.className = 'toast' + (bad ? ' toast--bad' : '');
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }

  function enterOwnerMode() {
    closeGate();
    document.body.classList.add('owner-mode');
    if (editorFab) editorFab.hidden = false;
    if (rootBadge) rootBadge.hidden = false;
    // 登录成功后【直接弹出编辑器】，省掉"再去点右下角按钮"这一步。
    // 关掉弹窗后，右下角的「✏️ 编辑」还在，随时可以再叫出来。
    openEditor();
  }

  function exitOwnerMode() {
    closeEditor();
    document.body.classList.remove('owner-mode');
    if (editorFab) editorFab.hidden = true;
    if (rootBadge) rootBadge.hidden = true;
    logout();      // 顺便通知后端把这张令牌作废
  }

  // 点"确认"：把密码【发给后端】，让后端说了算
  function submitPassword() {
    var pwd = (gateInput.value || '').trim();
    if (!pwd) return;

    setGateHint('正在验证…');
    if (gateOk) gateOk.disabled = true;     // 验证期间先别让他狂点

    loginWith(pwd)
      .then(function () {
        // 后端说密码对，还给了令牌 → loginWith 已经把它存好了
        setGateHint('回车确认 · Esc 取消');
        if (gateOk) gateOk.disabled = false;
        enterOwnerMode();
      })
      .catch(function (err) {
        setGateHint('回车确认 · Esc 取消');
        if (gateOk) gateOk.disabled = false;
        // 失败时什么都不说，只是抖一下（陌生人看了也以为是个坏掉的小弹窗）
        gateBox.classList.add('is-shake');
        setTimeout(function () { gateBox.classList.remove('is-shake'); }, 420);
        gateInput.value = '';
        gateInput.focus();
        console.warn('[login] 验证没通过：', err);
      });
  }

  function setGateHint(text) {
    var hint = document.getElementById('gateHint');
    if (hint) hint.textContent = text;
  }

  document.addEventListener('keydown', function (e) {
    if (gate && !gate.hidden) {
      if (e.key === 'Enter') { e.preventDefault(); submitPassword(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeGate(); }
      return;
    }
    // 编辑弹窗开着时：Esc 关掉它；其它按键不触发 ↑+←（免得弹窗上又叠一个密码框）
    if (editor && !editor.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeEditor(); }
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
  if (gateOk) gateOk.addEventListener('click', submitPassword);
  if (gateCancel) gateCancel.addEventListener('click', closeGate);
  if (gate) gate.addEventListener('click', function (e) { if (e.target === gate) closeGate(); });

  /* ---------------------- 编辑弹窗的点击事件 ---------------------- */
  var ownerExit = document.getElementById('ownerExit');
  if (ownerExit) ownerExit.addEventListener('click', exitOwnerMode);

  if (editorFab) editorFab.addEventListener('click', openEditor);
  if (editorBack) editorBack.addEventListener('click', function () { showScreen(null); });

  if (editor) {
    var editorCloseBtn = document.getElementById('editorClose');
    if (editorCloseBtn) editorCloseBtn.addEventListener('click', closeEditor);
    // 点"弹窗外面那圈模糊的遮罩"也关掉
    editor.addEventListener('click', function (e) { if (e.target === editor) closeEditor(); });
  }

  // 第 1 屏：点了哪一项，就切到哪一屏（从"选择"进来 = 新建，所以要清空并退出编辑状态）
  if (pickView) {
    pickView.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-editor]');
      if (!btn || btn.disabled) return;
      if (btn.dataset.editor === 'post') resetPostForm();
      if (btn.dataset.editor === 'essay') resetEssayForm();
      showScreen(btn.dataset.editor);
    });
  }

  // 「清空」：把那一屏里的输入框清干净
  function clearForm(formId) {
    var form = document.getElementById(formId);
    if (!form) return;
    var fields = form.querySelectorAll('input, textarea');
    for (var i = 0; i < fields.length; i += 1) fields[i].value = '';
  }
  var postResetBtn = document.getElementById('postReset');
  var essayResetBtn = document.getElementById('essayReset');
  if (postResetBtn) postResetBtn.addEventListener('click', resetPostForm);
  if (essayResetBtn) essayResetBtn.addEventListener('click', resetEssayForm);

  /* ---------------------- ③ 「保存」按钮：真的发给后端 ---------------------- */
  // 每个保存按钮都是同一套路：读表单 → 检查 → 发请求 → 成功后刷新 + 提示。
  // 结果怎么对应（和 docs/API.md 一致）：
  //   200 → 成功     401 → 登录过期（authFetch 里统一处理）
  //   404 → 要改的东西不在了      500 → 数据库拒绝（比如正文为空）

  function setBusy(btn, busy, normalText) {
    if (!btn) return;
    btn.disabled = busy;
    btn.textContent = busy ? '保存中…' : normalText;
  }

  // 发帖 / 改帖【共用】这一个函数：看 editing.postId 有没有值就知道是哪一种
  function savePostForm() {
    var body = document.getElementById('postBody').value.trim();
    if (!body) { showToast('正文不能为空', true); return; }      // 前端先挡一道（后端还会再挡）

    var data = {
      title: document.getElementById('postTitle').value.trim(),
      body: body,
      tags: document.getElementById('postTags').value.trim(),
      images: formImages.post       // 图片路径，顺序就是页面上的顺序
    };
    var date = document.getElementById('postPublishedAt').value;
    if (date) data.publishedAt = date;      // 不填就【不发】这个字段 → 后端自动用今天

    var isEdit = !!editing.postId;
    var btn = document.getElementById('postSave');
    setBusy(btn, true);
    // ★ 整个函数里只有这一行不同：有 id → 改（PUT）；没 id → 新建（POST）
    (isEdit ? apiUpdatePost(editing.postId, data) : apiCreatePost(data))
      .then(function () {
        showToast(isEdit ? '已更新 ✓' : '已发布 ✓');
        resetPostForm();
        closeEditor();
        loadPosts();                        // 重新拉一遍数据 → 页面上立刻看到结果
      })
      .catch(function (err) { showToast('没保存成功：' + err.message, true); })
      .then(function () { setBusy(btn, false); });
  }

  // 写随笔 / 改随笔 共用这一个函数
  function saveEssayForm() {
    var body = document.getElementById('essayBody').value.trim();
    if (!body) { showToast('正文不能为空', true); return; }

    var data = {
      title: document.getElementById('essayTitle').value.trim(),
      body: body,
      images: formImages.essay
    };
    var date = document.getElementById('essayWrittenOn').value;
    if (date) data.writtenOn = date;

    var isEdit = !!editing.essayId;
    var btn = document.getElementById('essaySave');
    setBusy(btn, true);
    (isEdit ? apiUpdateEssay(editing.essayId, data) : apiCreateEssay(data))
      .then(function () {
        showToast(isEdit ? '已更新 ✓' : '已保存 ✓');
        resetEssayForm();
        closeEditor();
        loadEssays();
      })
      .catch(function (err) { showToast('没保存成功：' + err.message, true); })
      .then(function () { setBusy(btn, false); });
  }

  function saveProfileForm() {
    // 资料是"改现有的东西"：必须先有现有资料，否则空表单会把你的资料清空
    if (!currentProfile) { showToast('还没拿到现有资料，刷新页面再试', true); return; }

    var patch = {
      name:    document.getElementById('profileName').value.trim(),
      tagline: document.getElementById('profileTagline').value.trim(),
      intro:   document.getElementById('profileIntro').value.trim(),
      github:  document.getElementById('profileGithub').value.trim()
    };
    // 🖼️ 这次换了头像 / 背景的话，把新路径一起带上 ✓（没换就一个字段都不发 ✓）
    if (appearPatch.avatarPath) patch.avatarPath = appearPatch.avatarPath;
    if (appearPatch.heroPath)   patch.heroPath   = appearPatch.heroPath;

    var btn = document.getElementById('profileSave');
    setBusy(btn, true);
    apiSaveProfile(patch)
      .then(function () {
        showToast('资料已更新 ✓');
        appearPatch = {};                   // 已经写进数据库了，清掉"待保存" ✓
        closeEditor();
        loadProfile();                      // 首页的名字 / 简介立刻变
      })
      .catch(function (err) { showToast('没保存成功：' + err.message, true); })
      .then(function () { setBusy(btn, false); });
  }

  // 打开"我的资料"时，把当前资料填进输入框（不然你不知道现在写着什么）
  function fillProfileForm() {
    if (!currentProfile) return;
    var set = function (id, val) { var el = document.getElementById(id); if (el) el.value = val || ''; };
    set('profileName', currentProfile.name);
    set('profileTagline', currentProfile.tagline);
    set('profileIntro', currentProfile.intro);
    set('profileGithub', currentProfile.github);

    drawThemePicker(currentProfile.theme);   // 🎨 色系缩略图（当前那套高亮 ✓）
    fillAppearPreviews();                    // 🖼️ 头像 / 背景的预览
  }

  /* ---------------------- 🎨 站点外观：色系 / 头像 / 背景 ---------------------- */

  // 色系列表：id 必须和 assets/css/themes.css 里的 [data-theme="…"] 完全一致 ✓
  var THEME_LIST = [
    { id: 'pink',   name: '粉' },   { id: 'sakura', name: '樱' },   { id: 'wine',   name: '酒红' },
    { id: 'orange', name: '橙' },   { id: 'amber',  name: '黄' },   { id: 'cocoa',  name: '可可' },
    { id: 'mint',   name: '绿' },   { id: 'lime',   name: '青柠' }, { id: 'cyan',   name: '青' },
    { id: 'teal',   name: '青碧' }, { id: 'blue',   name: '蓝' },   { id: 'indigo', name: '靛' },
    { id: 'violet', name: '紫' },   { id: 'slate',  name: '灰' },   { id: 'cream',  name: '米' },
    { id: 'neon',   name: '霓虹' }, { id: 'mono',   name: '黑白' }
  ];

  function themeName(id) {
    for (var i = 0; i < THEME_LIST.length; i += 1) if (THEME_LIST[i].id === id) return THEME_LIST[i].name;
    return id;
  }

  // 把色系写到 <html data-theme="…"> —— 全站颜色立刻跟着换 ✓（只重算颜色，不重排、不重载）
  function applyTheme(theme) {
    var id = theme || 'pink';
    var known = false;
    for (var i = 0; i < THEME_LIST.length; i += 1) if (THEME_LIST[i].id === id) known = true;
    if (!known) id = 'pink';                 // 数据库里存了个不认识的名字 → 回落到粉色 ✓

    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem('site.theme', id); } catch (e) { /* 无痕模式忽略 ✓ */ }

    // 顺手告诉手机浏览器：地址栏也用这个底色 ✓
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      if (bg) meta.setAttribute('content', bg);
    }
  }

  // 画色系缩略图：每个按钮自带 data-theme → 方块是用【那套主题自己的变量】画的 ✓
  function drawThemePicker(current) {
    var box = document.getElementById('themePick');
    if (!box) return;
    var active = current || 'pink';
    box.innerHTML = THEME_LIST.map(function (t) {
      return '<button type="button" class="themepick__item' + (t.id === active ? ' is-active' : '') +
        '" data-theme="' + t.id + '" data-pick-theme="' + t.id + '" title="' + t.name + ' 色系">' +
        '<span class="themepick__dot"></span>' +
        '<span class="themepick__name">' + t.name + '</span>' +
        '</button>';
    }).join('');
  }

  // 点一下色系 → 立刻生效 + 顺手存进数据库（不用再点「保存」✓）
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-pick-theme]');
    if (!btn) return;
    var id = btn.dataset.pickTheme;

    applyTheme(id);                 // 先让眼睛看到 ✓
    drawThemePicker(id);            // 再更新选中态 ✓
    if (currentProfile) currentProfile.theme = id;

    apiSaveProfile({ theme: id })
      .then(function () { showToast('已换成「' + themeName(id) + '」色系 ✓'); })
      .catch(function (err) { showToast('色系没存上：' + err.message, true); });
  });

  // 头像 / 背景：选完就上传 → 路径先记在 appearPatch，等点「保存」一起写 ✓
  var appearPatch = {};      // { avatarPath?: '…', heroPath?: '…' }

  function fillAppearPreviews() {
    var a = document.getElementById('profileAvatarPreview');
    var h = document.getElementById('profileHeroPreview');
    if (!currentProfile) return;
    if (a) a.src = imgUrl(appearPatch.avatarPath || currentProfile.avatarPath || 'assets/img/avatar.jpg');
    if (h) h.src = imgUrl(appearPatch.heroPath || currentProfile.heroPath || 'assets/img/hero-v4.jpg');
  }

  function wireAppearPick(inputId, btnId, field) {
    var input = document.getElementById(inputId);
    var btn = document.getElementById(btnId);
    if (!input || !btn) return;

    btn.addEventListener('click', function () { input.click(); });

    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      setBusy(btn, true);
      apiUploadImage(file)
        .then(function (res) {
          appearPatch[field] = res.path;   // ← 记下新路径
          fillAppearPreviews();            // 立刻看到 ✓
          showToast('图片已上传 ✓ 再点「保存」写入站里');
        })
        .catch(function (err) { showToast('上传失败：' + err.message, true); })
        .then(function () { setBusy(btn, false); input.value = ''; });
    });
  }

  wireAppearPick('profileAvatarInput', 'profileAvatarAdd', 'avatarPath');
  wireAppearPick('profileHeroInput',   'profileHeroAdd',   'heroPath');

  /* ---------------------- ④ 改 / 删已有的内容 ---------------------- */
  // 记住"现在正在改哪一条"：null = 新建（新建用 POST，改就用 PUT）
  var editing = { postId: null, essayId: null };

  function findRawPost(id) {
    for (var i = 0; i < RAW_POSTS.length; i += 1) if (RAW_POSTS[i].id === id) return RAW_POSTS[i];
    return null;
  }
  function findRawEssay(id) {
    for (var i = 0; i < ESSAYS.length; i += 1) if (ESSAYS[i].id === id) return ESSAYS[i];
    return null;
  }
  function showEditNote(id, show) {
    var el = document.getElementById(id);
    if (el) el.hidden = !show;
  }

  // 清空表单 + 回到"新建"状态（点「清空」或「取消修改」都走这里）
  function resetPostForm() {
    clearForm('editorPost');
    editing.postId = null;
    formImages.post = [];        // 图片清单也清掉（已经传上去的文件先留在服务器，以后写清理脚本）
    drawImages('post');
    showEditNote('postEditNote', false);
  }
  function resetEssayForm() {
    clearForm('editorEssay');
    editing.essayId = null;
    formImages.essay = [];
    drawImages('essay');
    showEditNote('essayEditNote', false);
  }

  // 点 ✏️：把那一条的内容回填进表单，并记住它的 id
  function startEditPost(id) {
    var raw = findRawPost(id);
    if (!raw) { showToast('没找到这条帖子，刷新页面再试', true); return; }

    editing.postId = id;
    document.getElementById('postTitle').value = raw.title || '';
    document.getElementById('postBody').value = raw.body || '';
    document.getElementById('postTags').value = raw.tags || '';
    document.getElementById('postPublishedAt').value = raw.publishedAt || '';
    formImages.post = (raw.images || []).slice();   // 现有图片先摆进"选图区"
    drawImages('post');
    showEditNote('postEditNote', true);

    openEditor();
    showScreen('post');
    if (editorTitle) editorTitle.textContent = '📝 修改这条帖子';
  }

  function startEditEssay(id) {
    var raw = findRawEssay(id);
    if (!raw) { showToast('没找到这篇随笔，刷新页面再试', true); return; }

    editing.essayId = id;
    document.getElementById('essayWrittenOn').value = raw.writtenOn || '';
    document.getElementById('essayTitle').value = raw.title || '';
    document.getElementById('essayBody').value = raw.body || '';
    formImages.essay = (raw.images || []).slice();
    drawImages('essay');
    showEditNote('essayEditNote', true);

    openEditor();
    showScreen('essay');
    if (editorTitle) editorTitle.textContent = '✒️ 修改这篇随笔';
  }

  // 点 🗑️：先问一句（确认框是浏览器自带的，最省事），再删
  function removePost(id) {
    var raw = findRawPost(id);
    var name = (raw && raw.title) ? raw.title : ('#' + id);
    if (!window.confirm('确定删掉这条帖子吗？\n\n' + name + '\n\n删了就找不回来了。')) return;

    apiDeletePost(id)
      .then(function () { showToast('已删除 ✓'); loadPosts(); })
      .catch(function (err) { showToast('没删成功：' + err.message, true); });
  }

  function removeEssay(id) {
    if (!window.confirm('确定删掉这篇随笔吗？\n\n删了就找不回来了。')) return;

    apiDeleteEssay(id)
      .then(function () { showToast('已删除 ✓'); loadEssays(); })
      .catch(function (err) { showToast('没删成功：' + err.message, true); });
  }

  // 列表是用 innerHTML 反复重画的 → 没法给每个按钮单独绑事件，
  // 所以绑在 document 上，靠点击"冒泡上来"再判断点的是哪个（这叫事件委托）
  document.addEventListener('click', function (e) {
    var t = e.target;
    var ep = t.closest('[data-edit-post]');
    if (ep) { e.preventDefault(); startEditPost(Number(ep.dataset.editPost)); return; }
    var dp = t.closest('[data-del-post]');
    if (dp) { e.preventDefault(); removePost(Number(dp.dataset.delPost)); return; }
    var ee = t.closest('[data-edit-essay]');
    if (ee) { e.preventDefault(); startEditEssay(Number(ee.dataset.editEssay)); return; }
    var de = t.closest('[data-del-essay]');
    if (de) { e.preventDefault(); removeEssay(Number(de.dataset.delEssay)); }
  });

  /* ---------------------- ⑤ 图片：选图 → 立刻上传 → 记下路径 ---------------------- */
  // 为什么"选完就上传"，而不是等点保存再一起传？
  //   ① 用户马上看到缩略图，知道自己选对没有
  //   ② 保存那一步只发一次 JSON（里面装着路径），不会出现"正文存了、图没存"的半截状态
  // 代价：选完图又没保存 → 磁盘上会留下一个没人用的文件（以后可以写个清理脚本）
  var formImages = { post: [], essay: [] };   // 每张图存的是后端给的【相对路径】
  var imgBusy = { post: 0, essay: 0 };        // 正在上传几张（用来显示"上传中…"）
  var IMG_MAX_MB = 5;                          // 和后端 UploadController 里的限制保持一致

  function imgListEl(which) {
    return document.getElementById(which === 'post' ? 'postImageList' : 'essayImageList');
  }

  function drawImages(which) {
    var box = imgListEl(which);
    if (!box) return;

    var html = formImages[which].map(function (path, i) {
      return '<span class="imgpick__item">' +
          '<img src="' + esc(imgUrl(path)) + '" alt="" />' +
          '<button type="button" class="imgpick__x" data-remove-image="' + which +
            '" data-img-index="' + i + '" title="删掉这张">✕</button>' +
        '</span>';
    }).join('');

    if (imgBusy[which] > 0) {
      html += '<span class="imgpick__item imgpick__item--busy">上传中…</span>';
    }
    box.innerHTML = html;
  }

  function uploadImages(which, files) {
    if (!files || !files.length) return;

    // 先转成真正的数组：FileList 不保证有 forEach；
    // 而且用 for 循环配 var 会让回调里拿到同一个 file（回调是循环结束后才跑的）
    Array.prototype.slice.call(files).forEach(function (file) {
      if (file.size > IMG_MAX_MB * 1024 * 1024) {
        showToast('「' + file.name + '」超过 5MB，没传上去', true);
        return;
      }

      imgBusy[which] += 1;
      drawImages(which);

      apiUploadImage(file)
        .then(function (res) {
          formImages[which].push(res.path);      // 路径拿到手，先记在"待保存清单"里
        })
        .catch(function (err) { showToast('有张图没传上去：' + err.message, true); })
        .then(function () {
          imgBusy[which] -= 1;
          drawImages(which);
        });
    });
  }

  // 「选图」按钮 → 打开系统文件框；选完 → 上传；缩略图上的 ✕ → 从清单里去掉
  ['post', 'essay'].forEach(function (which) {
    var addBtn = document.getElementById(which + 'ImageAdd');
    var input = document.getElementById(which + 'ImageInput');

    if (addBtn && input) {
      addBtn.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        uploadImages(which, input.files);
        input.value = '';    // 清空一下，同一张图想再选一次也有效
      });
    }

    var box = imgListEl(which);
    if (box) {
      box.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-remove-image]');
        if (!btn) return;
        formImages[which].splice(Number(btn.dataset.imgIndex), 1);
        drawImages(which);
      });
    }
  });

  var postSaveBtn = document.getElementById('postSave');
  var essaySaveBtn = document.getElementById('essaySave');
  var profileSaveBtn = document.getElementById('profileSave');
  if (postSaveBtn) postSaveBtn.addEventListener('click', savePostForm);
  if (essaySaveBtn) essaySaveBtn.addEventListener('click', saveEssayForm);
  if (profileSaveBtn) profileSaveBtn.addEventListener('click', saveProfileForm);

  var postCancelEdit = document.getElementById('postCancelEdit');
  var essayCancelEdit = document.getElementById('essayCancelEdit');
  if (postCancelEdit) postCancelEdit.addEventListener('click', resetPostForm);
  if (essayCancelEdit) essayCancelEdit.addEventListener('click', resetEssayForm);

  /* ---------------------- 第 2 步：让网页去调后端 ---------------------- */
  // 后端地址：
  //   本地打开 / GitHub Pages 预览  → 后端跑在自己电脑上，用 localhost:8080
  //   部署在服务器上（前后端同源）  → 用相对路径 ''，请求就是 /api/xxx
  //   ⚠️ 以后换域名也不用改这里，它会自己判断 ✓
  var host = location.hostname;
  var API_BASE = (host === '' || host === 'localhost' || host === '127.0.0.1' || host.indexOf('github.io') >= 0)
    ? 'http://localhost:8080'
    : '';

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

  /* ---------------------- 第 6 步：真的登录（拿令牌） ---------------------- */
  // 令牌存在浏览器的 localStorage 里 —— 相当于浏览器内部的一个小抽屉：
  // 关掉页面再打开它还在，所以"登录一次能用 12 小时"。
  // ⚠️ 用 try/catch 包着：某些浏览器在隐私模式下会禁止 localStorage，会直接报错。

  var TOKEN_KEY = 'site.owner.token';

  function saveToken(t) {
    try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { console.warn('存令牌失败：', e); }
  }

  function readToken() {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; }
  }

  function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch (e) { /* 忽略 */ }
  }

  /* ---------------------- ① 写入管道：所有"保存"都从这里出去 ---------------------- */
  // 为什么要单独包一层？三个理由：
  //   1. 每个写接口都必须带令牌 —— 在这里写一次，所有功能都不用重复写
  //   2. 令牌会过期（后端重启也会失效）→ 后端回 401 —— 在这里统一处理
  //   3. 统一把 JS 对象变成 JSON 文字、统一检查状态码
  //   （地址和字段名全部来自 docs/API.md —— 那份契约就是给这里用的）

  function authFetch(path, options) {
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Authorization'] = 'Bearer ' + readToken();

    // 传文件（FormData）时【不能】自己写 Content-Type：
    // 浏览器要往这个头里塞一段"边界字符串"（boundary）来分隔每个文件，我们自己写会把它搞坏。
    // 所以判断一下：是 FormData 就交给浏览器，其余一律当 JSON。
    var isForm = (typeof FormData !== 'undefined') && (options.body instanceof FormData);
    if (options.body && !isForm) options.headers['Content-Type'] = 'application/json';

    return fetch(API_BASE + path, options).then(function (res) {
      if (res.status === 401) {          // 令牌无效 / 过期
        onAuthExpired();
        throw new Error('登录已过期');
      }
      if (!res.ok) {
        // 后端拒绝时会带一句人话（{"ok":false,"message":"图太大了…"}）
        // 把它读出来显示给用户，比只说"HTTP 400"有用得多
        return res.json()
          .catch(function () { return null; })
          .then(function (body) {
            throw new Error((body && body.message) ? body.message : ('HTTP ' + res.status));
          });
      }
      return res.json();
    });
  }

  // 令牌失效时的统一动作：清掉本地令牌、退回访客模式，但【不】白屏
  function onAuthExpired() {
    clearToken();
    closeEditor();
    document.body.classList.remove('owner-mode');
    if (editorFab) editorFab.hidden = true;
    if (rootBadge) rootBadge.hidden = true;
    showToast('登录已过期，请重新登录（↑ + ←）', true);
  }

  /* ---------------------- ② 七个写动作（一个动作 = 一次 authFetch）---------------------- */
  function apiCreatePost(data)     { return authFetch('/api/admin/posts',         { method: 'POST',   body: JSON.stringify(data) }); }
  function apiUpdatePost(id, data) { return authFetch('/api/admin/posts/' + id,   { method: 'PUT',    body: JSON.stringify(data) }); }
  function apiDeletePost(id)       { return authFetch('/api/admin/posts/' + id,   { method: 'DELETE' }); }
  function apiCreateEssay(data)    { return authFetch('/api/admin/essays',        { method: 'POST',   body: JSON.stringify(data) }); }
  function apiUpdateEssay(id, data){ return authFetch('/api/admin/essays/' + id,  { method: 'PUT',    body: JSON.stringify(data) }); }
  function apiDeleteEssay(id)      { return authFetch('/api/admin/essays/' + id,  { method: 'DELETE' }); }
  function apiSaveProfile(patch)   { return authFetch('/api/admin/profile',       { method: 'PUT',    body: JSON.stringify(patch) }); }

  // 第 8 个动作：传一张图（第一个"不是 JSON"的写接口 —— 发的是文件）
  function apiUploadImage(file) {
    var form = new FormData();
    form.append('file', file);          // 字段名必须是 file，后端 @RequestParam("file") 等着它
    return authFetch('/api/admin/uploads', { method: 'POST', body: form });
  }

  // 把密码发给后端；成功 = 后端回 200 + 一张令牌
  function loginWith(password) {
    return fetch(API_BASE + '/api/login', {
      method: 'POST',                                     // ← 这次不是 GET 了，是 POST
      headers: { 'Content-Type': 'application/json' },    // ← 告诉后端"我发的是 JSON"
      body: JSON.stringify({ password: password })        // ← 把对象变成 JSON 文字
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);   // 密码错 → 401 → 直接跳去 catch
        return res.json();
      })
      .then(function (data) {
        saveToken(data.token);                            // 令牌到手，先存起来
      });
  }

  // 退出：让后端把这张令牌作废，同时清掉本地那份
  function logout() {
    var token = readToken();
    clearToken();                                          // 本地立刻清掉（不管后端成不成）
    if (!token) return Promise.resolve();

    return fetch(API_BASE + '/api/logout', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }      // ← 令牌放在【请求头】里
    }).catch(function () { /* 后端没开也无所谓，本地已经清掉了 */ });
  }

  // 打开页面时：本地如果还存着令牌，就让后端验一下；有效就直接进编辑模式
  function restoreLogin() {
    var token = readToken();
    if (!token) return;

    fetch(API_BASE + '/api/admin/whoami', {                 // 这个接口在门卫后面
      headers: { 'Authorization': 'Bearer ' + token }
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status); // 过期/无效 → 401
        return res.json();
      })
      .then(function () { enterOwnerMode(); })              // 门卫放行了 → 直接进编辑模式
      .catch(function () { clearToken(); });                // 没通过 → 清掉，当访客
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

    // 🎨 站长的色系：全站生效（数据库说了算 ✓）
    //    index.html 里的防闪脚本会先用缓存画一遍，这里再"确认"一次 ✓
    applyTheme(p.theme);

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
        currentProfile = profile;      // 记下来，"我的资料"表单要拿它回填
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

    return '<div class="entry-wrap">' +
      '<article class="entry">' +
        '<div class="entry__date">' + esc(date) + '</div>' +
        '<div class="entry__body">' + paras + '</div>' +
        // 随笔的图：这里拿到的是后端原样数据，所以路径要现场翻译成完整网址
        (e.images && e.images.length
          ? '<div class="entry__images">' + e.images.map(function (src) {
              return '<img src="' + esc(imgUrl(src)) + '" alt="" data-zoom="1" loading="lazy" />';
            }).join('') + '</div>'
          : '') +
      '</article>' +
      // ✏️🗑️ 只有站长看得见（body.owner-mode 控制显隐）
      '<div class="item-actions">' +
        '<button type="button" class="iconbtn" data-edit-essay="' + e.id + '" title="改这篇">✏️</button>' +
        '<button type="button" class="iconbtn iconbtn--danger" data-del-essay="' + e.id + '" title="删这篇">🗑️</button>' +
      '</div>' +
    '</div>';
  }

  function loadEssays() {
    fetch(API_BASE + '/api/essays')
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (list) {
        ESSAYS = list;                        // 存一份原样的（编辑回填要用）
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
        RAW_POSTS = list;                // 存一份原样的（编辑回填要用）
        POSTS = list.map(postFromApi);   // 再翻译一份给页面用
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
  restoreLogin();     // 本地还存着有效令牌的话，直接回到编辑模式

  // 支持用地址栏的 #home / #posts / #hobby 直接进来
  var hash = (location.hash || '').replace('#', '');
  if (hash && hash !== 'home') {
    if (document.getElementById('view-' + hash)) switchView(hash);
    else switchView('placeholder', NAV_TITLES[hash] || '这一页');
  }
})();
