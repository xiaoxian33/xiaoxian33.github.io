/**
 * os.js —— 桌面内核：开机自检 / 图标 / 任务栏 / 窗口管理器
 * ------------------------------------------------------------
 * 想加一个新窗口？在 APPS 里登记一行，再去 views.js 里写一个视图即可。
 */
window.CS = window.CS || {};

(function (CS) {
  'use strict';

  const APPS = [
    { id: 'about',     label: '关于我',     icon: '🙋', view: 'about' },
    { id: 'projects',  label: '我的项目',   icon: '📁', view: 'projects' },
    { id: 'skills',    label: '技能树',     icon: '🧬', view: 'skills' },
    { id: 'roadmap',   label: '未探索地图', icon: '🗺️', view: 'roadmap' },
    { id: 'changelog', label: '更新日志',   icon: '📜', view: 'changelog' },
    { id: 'npc',       label: 'AI 分身',    icon: '👤', view: 'npc' },
  ];

  const TASKBAR_H = 34;
  const wins = new Map();          // id -> { id, el, task, def }
  let zIndex = 10;

  const $ = (sel) => document.querySelector(sel);

  CS.windows = wins;
  CS.apps = APPS;

  /* ------------------------------ 开机自检 ------------------------------ */
  function bootLines(data) {
    const me = data.me || {};
    const count = (data.projects || []).length;
    return [
      { t: 'CYBER-OS BIOS v0.1.0   ·   built by xiaoxian33', c: 'head' },
      { t: ' Detecting CPU ................. 好奇心 ×1', c: 'ok' },
      { t: ' Memory test .................. 640K OK（够用了）', c: 'ok' },
      { t: ' Mounting /dev/dreams ......... OK', c: 'ok' },
      { t: ' Loading identity ............. ' + (me.name || '???'), c: 'ok' },
      { t: ' Loading portfolio ............ ' + count + ' 个作品已登记', c: 'ok' },
      { t: ' Starting window manager ...... OK', c: 'ok' },
      { t: ' Scanning hidden tunnel ....... [ 无权限 ]', c: 'dim' },
      { t: ' User mode .................... GUEST · 访客模式（只读）', c: 'warn' },
      { t: '', c: '' },
      { t: ' 欢迎登入 ✦ 这台电脑会一直长大', c: 'head' },
    ];
  }

  function runBoot(data) {
    return new Promise((resolve) => {
      const log = $('#boot-log');
      const boot = $('#boot');
      const lines = bootLines(data);
      let i = 0;
      let done = false;
      let timer = null;

      function append(text, cls) {
        const row = document.createElement('div');
        if (cls) row.className = 'line--' + cls;
        row.textContent = text || ' ';
        log.appendChild(row);
      }

      function finish() {
        if (done) return;
        done = true;
        clearTimeout(timer);
        while (i < lines.length) { const l = lines[i++]; append(l.t, l.c); }
        boot.classList.add('boot--out');
        setTimeout(() => { boot.hidden = true; resolve(); }, 460);
      }

      function step() {
        if (done) return;
        if (i >= lines.length) { timer = setTimeout(finish, 620); return; }
        const line = lines[i++];
        append(line.t, line.c);
        timer = setTimeout(step, line.t ? 135 : 70);
      }

      document.addEventListener('keydown', finish, { once: true });
      document.addEventListener('click', finish, { once: true });
      setTimeout(step, 260);
    });
  }

  /* ------------------------------ 桌面图标 / 开始菜单 / 时钟 ------------------------------ */
  function renderIcons() {
    $('#icons').innerHTML = APPS.map((a) => `
      <button class="icon" type="button" data-action="open-app" data-app="${a.id}">
        <span class="icon__glyph">${a.icon}</span>
        <span class="icon__label">${a.label}</span>
      </button>`).join('');
  }

  function buildStartMenu() {
    $('#startmenu').innerHTML = '<div class="startmenu__title">程序</div>' +
      APPS.map((a) => `
        <button class="startmenu__item" type="button" data-action="open-app" data-app="${a.id}">
          <span>${a.icon}</span><span>${a.label}</span>
        </button>`).join('');
  }

  function startClock() {
    const el = $('#clock');
    const pad = (n) => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      el.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------ 窗口管理器 ------------------------------ */
  function openWindow(def) {
    const id = def.id;
    if (wins.has(id)) { focusWindow(id); return wins.get(id); }

    const w = Math.min(def.width || 640, window.innerWidth - 40);
    const h = Math.min(def.height || 520, window.innerHeight - TASKBAR_H - 30);
    const offset = (wins.size % 6) * 26;

    const el = document.createElement('section');
    el.className = 'win' + (def.secret ? ' win--secret' : '');
    el.id = 'win-' + id;
    el.style.width = w + 'px';
    el.style.height = h + 'px';
    el.style.left = Math.max(12, Math.round((window.innerWidth - w) / 2) - 90 + offset) + 'px';
    el.style.top = Math.max(10, Math.round((window.innerHeight - TASKBAR_H - h) / 2) - 40 + offset) + 'px';

    const bar = document.createElement('header');
    bar.className = 'win__bar';
    bar.innerHTML =
      '<span class="win__dots"><i></i><i></i><i></i></span>' +
      '<span class="win__title">' + (def.icon ? def.icon + ' ' : '') + CS.escape(def.title || '窗口') + '</span>' +
      '<button class="win__btn" type="button" data-action="close-window" data-win="' + id + '" title="关闭">\u2715</button>';

    const body = document.createElement('div');
    body.className = 'win__body' + (def.bodyClass ? ' ' + def.bodyClass : '');
    if (def.node) body.appendChild(def.node);
    else body.innerHTML = def.html || '';

    el.appendChild(bar);
    el.appendChild(body);

    const task = document.createElement('button');
    task.className = 'task';
    task.type = 'button';
    task.dataset.action = 'focus-task';
    task.dataset.win = id;
    task.innerHTML = '<span>' + (def.icon || '') + '</span> ' + CS.escape(def.title || '');

    $('#windows').appendChild(el);
    $('#tasks').appendChild(task);

    wins.set(id, { id, el, task, def });
    makeDraggable(el, bar);
    el.addEventListener('pointerdown', () => focusWindow(id));

    focusWindow(id);
    if (typeof def.mount === 'function') def.mount(body, def);
    return wins.get(id);
  }

  function focusWindow(id) {
    const win = wins.get(id);
    if (!win) return;
    zIndex += 1;
    win.el.style.zIndex = zIndex;
    wins.forEach((w) => {
      w.el.classList.toggle('win--active', w === win);
      w.task.classList.toggle('task--active', w === win);
    });
  }

  function closeWindow(id) {
    const win = wins.get(id);
    if (!win) return;
    win.el.remove();
    win.task.remove();
    wins.delete(id);
    if (typeof CS.onWindowClose === 'function') CS.onWindowClose(id);
    const rest = Array.from(wins.keys());
    if (rest.length) focusWindow(rest[rest.length - 1]);
  }

  function openApp(appId) {
    const app = APPS.find((a) => a.id === appId || a.view === appId);
    if (!app) return;
    const view = CS.views && CS.views[app.view];
    if (!view) return;
    toggleStartMenu(false);
    openWindow({
      id: 'app-' + app.id,
      title: app.label,
      icon: app.icon,
      width: view.w,
      height: view.h,
      bodyClass: view.bodyClass,
      html: view.render(),
      mount: view.mount,
    });
  }

  function openProject(projectId) {
    const p = CS.findProject(projectId);
    if (!p) return;
    openWindow({
      id: 'project-' + p.id,
      title: (p.emoji || '📦') + ' ' + p.name,
      icon: '',
      width: 780,
      height: 660,
      html: CS.renderProjectDetail(p),
    });
  }

  /* ------------------------------ 拖动窗口 ------------------------------ */
  function makeDraggable(el, handle) {
    let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;

    handle.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      sx = e.clientX; sy = e.clientY;
      ox = el.offsetLeft; oy = el.offsetTop;
      try { handle.setPointerCapture(e.pointerId); } catch (_) { /* 忽略 */ }
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const nx = Math.min(Math.max(ox + e.clientX - sx, 8 - el.offsetWidth + 96), window.innerWidth - 96);
      const ny = Math.min(Math.max(oy + e.clientY - sy, 2), window.innerHeight - TASKBAR_H - 36);
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });

    const stop = (e) => {
      if (!dragging) return;
      dragging = false;
      try { handle.releasePointerCapture(e.pointerId); } catch (_) { /* 忽略 */ }
    };
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  /* ------------------------------ 开始菜单 ------------------------------ */
  function toggleStartMenu(force) {
    const menu = $('#startmenu');
    menu.hidden = typeof force === 'boolean' ? !force : !menu.hidden;
  }

  /* ------------------------------ 全局事件 ------------------------------ */
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-action]');
    if (!target) {
      if (!e.target.closest('#startmenu')) toggleStartMenu(false);
      return;
    }
    switch (target.dataset.action) {
      case 'open-app':     openApp(target.dataset.app); break;
      case 'open-project': openProject(target.dataset.project); break;
      case 'close-window': closeWindow(target.dataset.win); break;
      case 'focus-task':   focusWindow(target.dataset.win); break;
      default: break;
    }
  });

  function wireChrome() {
    $('#start').addEventListener('click', (e) => { e.stopPropagation(); toggleStartMenu(); });
    $('#version-chip').addEventListener('click', () => openApp('changelog'));
  }

  /* ------------------------------ 启动流程 ------------------------------ */
  async function init() {
    renderIcons();
    buildStartMenu();
    startClock();
    wireChrome();

    const data = await CS.loadData();
    await runBoot(data);

    $('#os').hidden = false;
    $('#os').classList.add('os--in');
    if (data.changelog && data.changelog.current) $('#version-chip').textContent = data.changelog.current;

    if (data.errors && data.errors.length) {
      openWindow({
        id: 'app-warn',
        title: '系统提示',
        icon: '⚠️',
        width: 580,
        height: 340,
        html: '<div class="sec">' +
          '<div class="sec__t">有 ' + data.errors.length + ' 处数据没能读到</div>' +
          '<ul class="list">' + data.errors.map((t) => '<li class="muted">' + CS.escape(t) + '</li>').join('') + '</ul>' +
          '<div class="faint">提示：如果是 file:// 协议，请双击项目根目录的 start.bat 用本地服务器打开。</div>' +
          '</div>',
      });
    }
  }

  /* ------------------------------ 导出 ------------------------------ */
  CS.openWindow = openWindow;
  CS.closeWindow = closeWindow;
  CS.focusWindow = focusWindow;
  CS.openApp = openApp;
  CS.openProject = openProject;
  CS.toggleStartMenu = toggleStartMenu;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.CS);


