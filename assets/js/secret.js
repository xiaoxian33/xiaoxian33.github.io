/**
 * secret.js —— 隐藏管理模式（创新点 ①）
 * ------------------------------------------------------------
 * 设计目标：
 *   1. 访客在页面上看不到任何「登录 / 后台」的痕迹；
 *   2. 只有作者知道怎么把终端叫出来（PC 端快捷键）；
 *   3. 输错也静默失败——看起来就只是一个没用的彩蛋；
 *   4. 真正的安全永远在后端：这里只是「门」，不是「锁」。
 *
 * 当前进度（M3）：终端 UI 已就位，认证接口留空等 M4 的后端接管。
 */
(function (CS) {
  'use strict';

  // M4 会把这个地址换成真实后端（Spring Boot）的地址
  const OWNER_API = ''; // 例如 'https://your-tunnel.ngrok-free.dev/api/owner/login'

  const TRIGGER = { ctrl: true, shift: true, key: 'O' }; // Ctrl + Shift + O
  const WAVE_KEY = '`'; // 备用暗号：波浪键 ~

  let termEl = null;
  let busy = false;

  function write(html, cls) {
    if (!termEl) return;
    const line = document.createElement('div');
    line.className = 'term__line' + (cls ? ' term__line--' + cls : '');
    line.innerHTML = html;
    termEl.querySelector('.term__out').appendChild(line);
    termEl.querySelector('.term__out').scrollTop = 1e6;
  }

  function promptLine() {
    const row = document.createElement('div');
    row.className = 'term__line term__line--input';
    row.innerHTML = '<span class="term__ps">guest@cyber-os:/$</span>' +
      '<input class="term__input" type="text" spellcheck="false" autocomplete="off" ' +
      'aria-label="terminal input" />';
    termEl.querySelector('.term__out').appendChild(row);
    const input = row.querySelector('input');
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const value = input.value.trim();
        row.replaceWith(staticLine(value));
        run(value);
        if (termEl) promptLine();
      }
    });
    termEl.querySelector('.term__out').scrollTop = 1e6;
    setTimeout(() => input.focus(), 0);
  }

  function staticLine(value) {
    const line = document.createElement('div');
    line.className = 'term__line';
    line.innerHTML = '<span class="term__ps">guest@cyber-os:/$</span> ' + CS.escape(value);
    return line;
  }

  function open() {
    if (CS.windows.has('secret-term')) { CS.focusWindow('secret-term'); focusInput(); return; }

    const tpl = document.createElement('template');
    tpl.innerHTML = `
      <div class="term">
        <div class="term__head">CYBER-OS · 未知设备已接入</div>
        <div class="term__out"></div>
      </div>`.trim();

    CS.openWindow({
      id: 'secret-term',
      title: '???',
      icon: '▚',
      width: 620,
      height: 380,
      secret: true,
      bodyClass: 'body--term',
      node: tpl.content.firstElementChild,
    });

    termEl = document.querySelector('#win-secret-term .term');
    write('安全通道已打开。本设备身份：<em>未经验证</em>');
    write('输入 <em>help</em> 查看我能做什么。', 'dim');
    promptLine();
  }

  function focusInput() {
    const input = termEl && termEl.querySelector('.term__input');
    if (input) input.focus();
  }

  function greeting() {
    const hour = new Date().getHours();
    if (hour < 5) return '这个点还没睡？';
    if (hour < 11) return '早上好。';
    if (hour < 18) return '下午好。';
    return '晚上好。';
  }

  async function run(cmd) {
    if (busy || !cmd) return;
    const [name, ...args] = cmd.split(/\s+/);

    switch (name.toLowerCase()) {
      case 'help':
        write('可用指令：');
        write('  help            看看有什么能敲的');
        write('  whoami          我是谁');
        write('  status          这台机器的状态');
        write('  version         当前版本');
        write('  root &lt;密钥&gt;     以主人身份接入（需要后端已上线）');
        write('  clear           清屏');
        break;

      case 'whoami':
        write('guest —— 一位路过的访客。');
        write('如果你觉得自己应该是这台机器的主人，那说明你还没证明这件事。', 'dim');
        break;

      case 'status':
        write('CPU   : 好奇心 ×1');
        write('MEM   : 常年占用 87%（剩下的在想晚饭吃什么）');
        write('TUNNEL: ' + ((CS.data && CS.data.projects || []).length) + ' 个作品已登记');
        write('MODE  : GUEST 访客模式 · 只读', 'warn');
        break;

      case 'version':
        write('CYBER-OS ' + ((CS.data && CS.data.changelog && CS.data.changelog.current) || 'v0.1.0'));
        break;

      case 'root':
        await login(args.join(' '));
        break;

      case 'clear':
        if (termEl) termEl.querySelector('.term__out').innerHTML = '';
        break;

      default:
        // 关键设计：静默失败。不出现任何「登录」「密码错误」这类字眼。
        write('command not found: ' + CS.escape(name), 'dim');
    }
  }

  /** 主人密钥验证：M4 之前一律静默失败，不泄露任何信息 */
  async function login(key) {
    if (!key) { write('command not found: root', 'dim'); return; }
    if (!OWNER_API) {
      write('tunnel offline. 通道尚未接通。', 'dim');
      return;
    }
    busy = true;
    try {
      const res = await fetch(OWNER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) { write('command not found: root', 'dim'); return; }
      const data = await res.json();
      localStorage.setItem('cyber.device_token', data.token);
      write('身份已确认：' + CS.escape((CS.data && CS.data.me && CS.data.me.name) || 'OWNER'), 'ok');
      write(greeting() + ' 编辑模式已解锁。', 'ok');
      document.body.classList.add('is-owner');
      if (CS.onOwnerUnlock) CS.onOwnerUnlock();
    } catch (err) {
      write('tunnel offline. 通道尚未接通。', 'dim');
    } finally {
      busy = false;
    }
  }

  function isTyping(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  document.addEventListener('keydown', (e) => {
    const key = (e.key || '').toLowerCase();
    const combo = e.ctrlKey === TRIGGER.ctrl && e.shiftKey === TRIGGER.shift && key === TRIGGER.key.toLowerCase();
    const wave = key === WAVE_KEY && !isTyping(document.activeElement);

    if (combo || wave) {
      e.preventDefault();
      open();
    }
  });

  CS.secret = { open, write, isOwner: () => document.body.classList.contains('is-owner') };

  // 窗口被关掉后让终端引用失效，避免指向已经移除的 DOM
  CS.onWindowClose = function (id) {
    if (id === 'secret-term') termEl = null;
  };
})(window.CS);
