/**
 * 作品集索引生成器
 * ------------------------------------------------------------
 * 作用：扫描 data/projects/*.json，自动生成 data/projects/index.json，
 *      让「新增一个项目」= 丢一个 JSON 进来 + 跑一条命令（不需要改任何页面代码）。
 *
 * 用法：node tools/index-projects.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const projectsDir = join(root, 'data', 'projects');
const indexPath = join(projectsDir, 'index.json');

const STATUS_WEIGHT = { done: 0, building: 1, planned: 2, archived: 3 };

const files = (await readdir(projectsDir))
  .filter((f) => f.endsWith('.json') && f !== 'index.json');

const projects = [];
for (const file of files) {
  try {
    const raw = await readFile(join(projectsDir, file), 'utf8');
    const data = JSON.parse(raw);
    projects.push({ file, id: data.id || file.replace(/\.json$/, ''), status: data.status || 'planned', featured: !!data.featured });
  } catch (err) {
    console.warn(`[skip] ${file} 解析失败：${err.message}`);
  }
}

projects.sort((a, b) => {
  if (a.featured !== b.featured) return a.featured ? -1 : 1;
  return (STATUS_WEIGHT[a.status] ?? 9) - (STATUS_WEIGHT[b.status] ?? 9);
});

const index = {
  generatedAt: new Date().toISOString().slice(0, 10),
  note: '由 tools/index-projects.mjs 自动生成：node tools/index-projects.mjs',
  order: projects.map((p) => p.file),
};

await writeFile(indexPath, JSON.stringify(index, null, 2) + '\n', 'utf8');
console.log(`✅ 已登记 ${index.order.length} 个作品：`);
for (const p of projects) console.log(`   - ${p.file}  [${p.status}]${p.featured ? ' ★' : ''}`);
