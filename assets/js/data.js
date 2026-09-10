/**
 * data.js —— 数据层
 * ------------------------------------------------------------
 * 全站内容都来自 data/ 目录下的 JSON。
 * 想扩充网站？去改 JSON，不要来改这里的代码。
 */
window.CS = window.CS || {};

(function (CS) {
  'use strict';

  // 单文件数据源（改名/加文件都在这里登记，或者以后改成自动扫描）
  const SOURCES = {
    me: 'data/me.json',
    skills: 'data/skills.json',
    roadmap: 'data/roadmap.json',
    changelog: 'data/changelog.json',
    projectIndex: 'data/projects/index.json',
  };

  async function getJSON(path) {
    const res = await fetch(path, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${path} → HTTP ${res.status}`);
    return res.json();
  }

  /** 加载全站数据；单个文件挂了不影响其它文件 */
  CS.loadData = async function loadData() {
    const data = { errors: [] };

    for (const [key, path] of Object.entries(SOURCES)) {
      try {
        data[key] = await getJSON(path);
      } catch (err) {
        data.errors.push(err.message);
      }
    }

    // 作品集：按索引逐个读取（新增项目 = 丢文件 + 跑一次 tools/index-projects.mjs）
    data.projects = [];
    const order = (data.projectIndex && data.projectIndex.order) || [];
    for (const file of order) {
      try {
        data.projects.push(await getJSON('data/projects/' + encodeURIComponent(file)));
      } catch (err) {
        data.errors.push(err.message);
      }
    }

    if (location.protocol === 'file:') {
      data.errors.push('当前是 file:// 直开模式，浏览器会拦截数据读取。请用项目里的 start.bat 启动本地服务器。');
    }

    CS.data = data;
    return data;
  };

  CS.findProject = function findProject(id) {
    return (CS.data && CS.data.projects || []).find((p) => p.id === id) || null;
  };

  /** 渲染前一律转义，防止 JSON 里写了奇怪字符把页面搞坏 */
  CS.escape = function escape(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  };

  CS.date = function date(iso) {
    if (!iso) return '';
    return String(iso).replace(/-/g, '.');
  };
})(window.CS);
