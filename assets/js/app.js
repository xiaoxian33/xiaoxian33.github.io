/* ============================================================
   张书贤 · 个人小站 · 交互脚本
   ------------------------------------------------------------
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

  /* ---------------------- 列表 + 分页 ---------------------- */
  var state = { home: 1, all: 1 };

  function mountList(listId, pagerId, key) {
    var listEl = document.getElementById(listId);
    var pagerEl = document.getElementById(pagerId);
    if (!listEl || !pagerEl) return;

    var totalPages = Math.max(1, Math.ceil(POSTS.length / PAGE_SIZE));

    function draw() {
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
  }

  /* ---------------------- 页面切换 ---------------------- */
  var NAV_TITLES = {
    hobby: '兴趣爱好',
    skill: '专业技能',
    projects: '做过的项目',
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
    if (view === 'home' || view === 'posts') {
      switchView(view);
    } else {
      switchView('placeholder', NAV_TITLES[view] || '这一页');
    }
    if (history.replaceState) history.replaceState(null, '', '#' + view);
  });

  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
    });
  }

  /* ---------------------- 启动 ---------------------- */
  mountList('postListHome', 'pagerHome', 'home');
  mountList('postListAll', 'pagerAll', 'all');

  // 支持用地址栏的 #home / #posts / #hobby 直接进来
  var hash = (location.hash || '').replace('#', '');
  if (hash === 'posts') switchView('posts');
  else if (hash && hash !== 'home') switchView('placeholder', NAV_TITLES[hash] || '这一页');
})();
