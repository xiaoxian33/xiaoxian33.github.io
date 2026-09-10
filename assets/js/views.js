/**
 * views.js —— 各窗口的内容视图
 * ------------------------------------------------------------
 * 约定：每个视图是一个对象 { title, icon, w, h, render(), mount?() }
 *   render() 返回 HTML 字符串（已转义）
 *   mount(el) 可选，用来绑定交互
 * 想加一个新窗口？在这里加一个视图 + 在 os.js 的 APPS 里登记一行。
 */
window.CS = window.CS || {};

(function (CS) {
  'use strict';

  const esc = CS.escape;

  const STATUS = {
    done: { label: '已完成', cls: 'badge--done' },
    building: { label: '建造中', cls: 'badge--building' },
    planned: { label: '计划中', cls: 'badge--planned' },
    archived: { label: '已归档', cls: 'badge--archived' },
  };

  function badge(status) {
    const meta = STATUS[status] || STATUS.planned;
    return `<span class="badge ${meta.cls}">${esc(meta.label)}</span>`;
  }

  function chips(list, cls) {
    return (list || []).map((s) => `<span class="chip${cls ? ' ' + cls : ''}">${esc(s)}</span>`).join('');
  }

  function list(items) {
    if (!items || !items.length) return '<div class="faint">（还没写）</div>';
    return '<ul class="list">' + items.map((i) => `<li>${esc(i)}</li>`).join('') + '</ul>';
  }

  /* ------------------------------ 作品卡片 ------------------------------ */
  function projectCard(p) {
    return `
      <button class="card${p.featured ? ' card--featured' : ''}" type="button"
              data-action="open-project" data-project="${esc(p.id)}">
        <div class="card__top">
          <span class="card__emoji">${esc(p.emoji || '📦')}</span>
          <span class="card__name">${esc(p.name)}</span>
          ${badge(p.status)}
        </div>
        <div class="card__sub">${esc(p.subtitle || '')}${p.period ? ' · ' + esc(p.period) : ''}</div>
        <div class="card__tagline">${esc(p.tagline || '')}</div>
        <div class="chips">${chips(p.stack)}</div>
        <div class="card__foot">
          <span class="faint">${esc(p.role || '')}</span>
          <span class="card__more">打开 →</span>
        </div>
      </button>`;
  }

  /* ------------------------------ 作品详情 ------------------------------ */
  function projectDetail(p) {
    const story = p.story || {};
    const links = (p.links || [])
      .map((l) => `<a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`)
      .join(' ');

    return `
      <div class="proj__head">
        <span class="proj__emoji">${esc(p.emoji || '📦')}</span>
        <div>
          <div class="proj__title">${esc(p.name)} ${badge(p.status)}</div>
          <div class="proj__meta">${esc(p.subtitle || '')} · ${esc(p.role || '')} · ${esc(p.period || '')}</div>
        </div>
      </div>

      <div class="proj__tagline">${esc(p.tagline || '')}</div>

      <div class="sec">
        <div class="sec__t">这是个什么东西</div>
        <div class="muted">${esc(p.summary || '')}</div>
      </div>

      <div class="sec">
        <div class="sec__t">技术栈</div>
        <div class="chips">${chips(p.stack, 'chip--cyan')}</div>
      </div>

      <div class="sec">
        <div class="sec__t">它是怎么长出来的</div>
        <div class="sec__sub">我更想让人看到的是过程，而不是一张完美的成品照。</div>
        <div class="proj__grid">
          <div class="block block--hl">
            <div class="block__t">想解决什么</div>
            <div class="muted">${esc(story.problem || '（还没写）')}</div>
          </div>
          <div class="block block--pit">
            <div class="block__t">踩过的坑</div>
            ${list(story.pits)}
          </div>
          <div class="block block--fix">
            <div class="block__t">后来怎么升级的</div>
            ${list(story.upgrade)}
          </div>
        </div>
      </div>

      ${p.highlights && p.highlights.length ? `
      <div class="sec">
        <div class="sec__t">亮点</div>
        ${list(p.highlights)}
      </div>` : ''}

      ${p.learned ? `
      <div class="sec">
        <div class="sec__t">我从里面带走了什么</div>
        <div class="note">${esc(p.learned)}</div>
      </div>` : ''}

      ${p.future && p.future.length ? `
      <div class="sec">
        <div class="sec__t">如果还有下一次</div>
        ${list(p.future)}
      </div>` : ''}

      ${links ? `<div class="sec">${links}</div>` : ''}
    `;
  }

  /* ------------------------------ 关于我 ------------------------------ */
  const viewAbout = {
    title: '关于我',
    icon: '🙋',
    w: 580,
    h: 580,
    render() {
      const me = CS.data.me || {};
      const bio = (me.bio || []).map((t) => `<p class="muted">${esc(t)}</p>`).join('');
      const contacts = (me.contacts || [])
        .map((c) => `<a class="chip chip--cyan" href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.label)} · ${esc(c.value)}</a>`)
        .join('');

      return `
        <div class="proj__head">
          <span class="proj__emoji">🧑‍💻</span>
          <div>
            <div class="proj__title">${esc(me.name || '')} <span class="chip">@${esc(me.handle || '')}</span></div>
            <div class="proj__meta">${esc(me.tagline || '')} · ${esc(me.grade || '')}</div>
          </div>
        </div>

        <div class="sec">
          <div class="sec__t">我是谁</div>
          ${bio || '<div class="faint">（还没写）</div>'}
        </div>

        <div class="sec">
          <div class="sec__t">现在在干什么</div>
          <div class="note">${esc(me.status || '')}</div>
        </div>

        <div class="sec">
          <div class="sec__t">怎么找到我</div>
          <div class="chips">${contacts || '<span class="faint">（还没写）</span>'}</div>
        </div>

        <div class="sec">
          <div class="sec__t">还喜欢这些</div>
          <div class="chips">${chips(me.interests, 'chip--pink')}</div>
        </div>

        <div class="faint">提示：这台电脑里还藏着一个能替我说几句话的窗口，在桌面上找找看。</div>
      `;
    },
  };

  /* ------------------------------ 我的项目 ------------------------------ */
  const viewProjects = {
    title: '我的项目',
    icon: '📁',
    w: 740,
    h: 620,
    render() {
      const items = CS.data.projects || [];
      const done = items.filter((p) => p.status === 'done').length;
      const building = items.filter((p) => p.status === 'building').length;

      return `
        <div class="sec">
          <div class="sec__t">作品集</div>
          <div class="sec__sub">
            已完成 ${done} 个 · 建造中 ${building} 个 · 共登记 ${items.length} 个。
            新增一个作品，只需要往 data/projects/ 里丢一个 JSON 文件。
          </div>
          <div class="cards">
            ${items.length ? items.map(projectCard).join('') : '<div class="faint">作品还没登记进来。</div>'}
          </div>
        </div>`;
    },
  };

  /* ------------------------------ 技能树 ------------------------------ */
  const viewSkills = {
    title: '技能树',
    icon: '🧬',
    w: 700,
    h: 620,
    render() {
      const d = CS.data.skills || {};
      const legend = (d.legend || [])
        .map((l) => `<span class="legend__item"><i class="dot dot--${esc(l.level)}"></i>${esc(l.label)} — ${esc(l.desc)}</span>`)
        .join('');

      const branches = (d.branches || []).map((b) => `
        <div class="branch">
          <div class="branch__head">
            <span class="branch__icon">${esc(b.icon || '◆')}</span>
            <span class="branch__name">${esc(b.name)}</span>
          </div>
          <div class="skills">
            ${(b.skills || []).map((s) => `
              <div class="skill skill--${esc(s.level)}">
                <div class="skill__body">
                  <div class="skill__name">${esc(s.name)}</div>
                  <div class="skill__note">${esc(s.note || '')}</div>
                </div>
                ${s.evidence ? `<a class="skill__ev" href="${esc(s.evidence.url)}" target="_blank" rel="noopener">${esc(s.evidence.label)} ↗</a>` : ''}
              </div>`).join('')}
          </div>
        </div>`).join('');

      return `
        <div class="sec">
          <div class="sec__t">${esc(d.title || '技能树')}</div>
          <div class="sec__sub">${esc(d.subtitle || '')}</div>
          <div class="legend">${legend}</div>
          ${branches}
        </div>`;
    },
  };

  /* ------------------------------ 未探索地图 ------------------------------ */
  const viewRoadmap = {
    title: '未探索地图',
    icon: '🗺️',
    w: 780,
    h: 620,
    render() {
      const d = CS.data.roadmap || {};
      const zones = d.zones || [];
      const count = (s) => zones.filter((z) => z.status === s).length;

      const cards = zones.map((z) => `
        <div class="zone zone--${esc(z.status)}">
          <div class="zone__head">
            <span class="zone__icon">${esc(z.icon || '❔')}</span>
            <span class="zone__name">${esc(z.name)}</span>
          </div>
          <div class="zone__desc">${esc(z.desc || '')}</div>
          <div class="zone__bar"><div class="zone__fill"></div></div>
        </div>`).join('');

      return `
        <div class="sec">
          <div class="sec__t">${esc(d.title || '未探索地图')}</div>
          <div class="sec__sub">${esc(d.subtitle || '')}</div>
          <div class="faint">已建成 ${count('done')} · 建造中 ${count('building')} · 待探索 ${count('planned')}</div>
        </div>
        <div class="map">${cards}</div>`;
    },
  };

  /* ------------------------------ 更新日志 ------------------------------ */
  const viewChangelog = {
    title: '更新日志',
    icon: '📜',
    w: 660,
    h: 580,
    render() {
      const d = CS.data.changelog || {};
      const current = d.current || 'v0.0.1';
      const entries = (d.entries || []).map((e) => `
        <div class="log__entry">
          <div>
            <span class="log__ver">${esc(e.version)}</span>
            <span class="log__date">${esc(CS.date(e.date))}</span>
          </div>
          <div class="log__title">${esc(e.title || '')}</div>
          ${list(e.items)}
        </div>`).join('');

      return `
        <div class="sec">
          <div class="sec__t">发版记录 · 当前 ${esc(current)}</div>
          <div class="sec__sub">${esc(d.note || '')}</div>
        </div>
        <div class="log">${entries || '<div class="faint">还没有记录。</div>'}</div>`;
    },
  };

  /* ------------------------------ AI 分身（规则版） ------------------------------ */
  // 说明：现在它只会「照本宣科」——从 data/ 里捞答案。
  // 等笔记与手账攒够，这个函数会被换成真正的 RAG 版本（见 docs/PLAN.md 的 M6）。
  function greet() {
    const h = new Date().getHours();
    if (h < 5) return '这个点了还没睡？';
    if (h < 11) return '早上好。';
    if (h < 18) return '下午好。';
    return '晚上好。';
  }

  function litSkills(level) {
    const out = [];
    ((CS.data.skills && CS.data.skills.branches) || []).forEach((b) => {
      (b.skills || []).forEach((s) => { if (s.level === level) out.push(s.name); });
    });
    return out;
  }

  function answer(q) {
    const d = CS.data || {};
    const me = d.me || {};
    const text = String(q || '').toLowerCase();
    const has = (...keys) => keys.some((k) => text.includes(k));

    if (!String(q || '').trim()) return '你什么都没问，那我就当你默认想听我说一句：我还在长大。';

    if (has('你是谁', '介绍', 'who', '名字')) {
      return `${me.name}（@${me.handle}）\n${me.tagline}\n${(me.bio || [])[0] || ''}`;
    }
    if (has('项目', '作品', '做过', '写了什么')) {
      const items = d.projects || [];
      if (!items.length) return '作品还没登记进来。';
      return items.map((p) => `${p.emoji || '📦'} ${p.name}（${(STATUS[p.status] || {}).label || ''}）\n    ${p.tagline || ''}`).join('\n');
    }
    if (has('技术', '技能', '会什么', '会哪些', '框架', '语言')) {
      return '已经点亮的：' + litSkills('lit').join('、') +
        '\n正在修炼的：' + litSkills('learning').join('、') +
        '\n还没解锁的：' + litSkills('locked').join('、');
    }
    if (has('计划', '未来', '接下来', '想做', 'roadmap', '以后')) {
      const zones = (d.roadmap && d.roadmap.zones) || [];
      const opened = zones.filter((z) => z.status !== 'done');
      return '还在图纸上的区域：\n' + opened.map((z) => `${z.icon || '❔'} ${z.name} —— ${z.desc || ''}`).join('\n');
    }
    if (has('联系', '邮箱', 'github', '怎么找', '加个')) {
      return (me.contacts || []).map((c) => `${c.label}：${c.value}`).join('\n');
    }
    if (has('爱好', '兴趣', '游戏', '喜欢', '平时')) {
      return '喜欢：' + (me.interests || []).join('、') +
        '。如果你也喜欢那种会让人沉默很久的叙事游戏，我们能聊一晚上。';
    }
    if (has('后台', '管理', 'root', '秘密', '密码', '登录', '隐藏', 'admin')) {
      return '有些门得自己敲出来。\n提示：比起鼠标，键盘更接近答案。';
    }
    if (has('你好', 'hi', 'hello', '在吗', '嗨')) {
      return greet() + '我就是这台电脑里那个还没长大的我。\n你可以问我：你做过什么项目 / 你会什么技术 / 接下来想做什么。';
    }
    return '这个问题我还答不上来——我现在只会照着 data/ 里的资料念。\n换个问法试试：「你做过什么项目？」「你会什么技术？」「怎么联系你？」';
  }

  const viewNpc = {
    title: 'AI 分身「另一个我」',
    icon: '👤',
    w: 620,
    h: 580,
    bodyClass: 'body--chat',
    render() {
      return `
        <div class="chat">
          <div class="chat__log" id="npc-log"></div>
          <div class="chat__quick">
            <button type="button" data-q="你做过什么项目？">你做过什么项目？</button>
            <button type="button" data-q="你会什么技术？">你会什么技术？</button>
            <button type="button" data-q="接下来想做什么？">接下来想做什么？</button>
            <button type="button" data-q="怎么联系你？">怎么联系你？</button>
          </div>
          <form class="chat__form" id="npc-form">
            <input class="chat__input" id="npc-input" type="text"
                   placeholder="随便问点什么……" autocomplete="off" />
            <button class="chat__send" type="submit">发送</button>
          </form>
        </div>`;
    },
    mount(el) {
      const log = el.querySelector('#npc-log');
      const form = el.querySelector('#npc-form');
      const input = el.querySelector('#npc-input');

      const say = (who, body, mine) => {
        const row = document.createElement('div');
        row.className = 'msg ' + (mine ? 'msg--me' : 'msg--npc');
        row.innerHTML = '<div class="msg__who">' + (mine ? '访客' : '另一个我') + '</div>' +
          '<div class="msg__body">' + CS.escape(body) + '</div>';
        log.appendChild(row);
        log.scrollTop = 1e6;
      };

      say('npc', greet() + '我是张书贤的 AI 分身。\n现在还只是个"照本宣科"的版本：只会读 data/ 里的资料回答。等我攒够了笔记和手账，它会被换成真正会说话的我。');

      const ask = (q) => {
        if (!q) return;
        say('visitor', q, true);
        setTimeout(() => say('npc', answer(q)), 200);
      };

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        ask(input.value.trim());
        input.value = '';
      });
      el.querySelectorAll('[data-q]').forEach((btn) => {
        btn.addEventListener('click', () => ask(btn.dataset.q));
      });
      input.focus();
    },
  };

  /* ------------------------------ 注册 ------------------------------ */
  CS.views = {
    about: viewAbout,
    projects: viewProjects,
    skills: viewSkills,
    roadmap: viewRoadmap,
    changelog: viewChangelog,
    npc: viewNpc,
  };
  CS.projectCard = projectCard;
  CS.renderProjectDetail = projectDetail;
})(window.CS);



