/* ============================================================
   张书贤 · 个人小站 · 交互脚本
   ------------------------------------------------------------
   现在帖子是写死在下面的假数据，先把样子做出来给你看。
   以后接了后端，这段数据换成从数据库里取就行（其余代码不用改）。
   ============================================================ */

(function () {
  'use strict';

  /* ---------------------- 假数据：假装这里是我的帖子 ---------------------- */
  var POSTS = [
    { date: '2026-09-10', title: '重新开始：把个人网站当成一个真正的项目', excerpt: '删掉了之前那版实验，这一次想认真做一个「能一直长大」的小站。', tags: ['随笔', '网站'] },
    { date: '2026-09-08', title: '从「前端传 userId」到「后端发身份证」', excerpt: '把身份交给前端声明，等于把家门钥匙插在门上——这是我这个学期最大的收获。', tags: ['Spring Boot', '安全'] },
    { date: '2026-09-05', title: '我踩的第一个坑：为什么我写的接口谁都能改', excerpt: '调试时发现，只要把 userId 改个数字，就能动别人的数据。那天我理解了「水平越权」。', tags: ['踩坑', 'Java'] },
    { date: '2026-09-02', title: 'JPA 和 MyBatis 到底怎么选', excerpt: '一个帮你自动生成查询，一个让你自己写 SQL。简单项目我用 JPA，复杂统计我倾向 MyBatis。', tags: ['JPA', 'MySQL'] },
    { date: '2026-08-28', title: '用 ngrok 把本地项目发到公网给人看', excerpt: '电脑关机就失效，但演示给同学看真的够用了。附上我踩过的端口小坑。', tags: ['工具', '部署'] },
    { date: '2026-08-25', title: '凯撒密码写完之后，我才懂什么叫频率分析', excerpt: '写加密很容易，写破解才有意思：统计字母出现次数，就能猜出偏移量。', tags: ['密码学', '作业'] },
    { date: '2026-08-20', title: '写文档比写代码更累，但更值', excerpt: '把「为什么这么改」写下来之后，我发现自己才是最大的受益者。', tags: ['随笔', '文档'] },
    { date: '2026-08-16', title: '第一次把课程作业当成产品来做', excerpt: '加了动效、写了免责声明、还配了演示账号——那一刻它不再像作业了。', tags: ['项目', '反思'] },
    { date: '2026-08-10', title: '我的学习笔记是怎么记的', excerpt: '只记三样：今天卡在哪、怎么解决、下次怎么少走弯路。', tags: ['学习方法'] }
  ];

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
