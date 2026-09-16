# 接口契约（API.md）

> **这份文件是干什么的**：前后端之间"接头点"的清单 —— 每个接口**要什么字段、还什么字段、什么时候会失败**。
> 写代码前先看它，改接口后同步改它。**不要再靠记忆**（上次就是没对账：前端的 `date` 和后端的 `publishedAt` 对不上）。
>
> 最后核对时间：2026-09-16（对着实体类 + 控制器逐个核过）

## 目录

- [〇、通用约定](#〇通用约定)
- [一、门卫规则：哪些公开、哪些要令牌](#一门卫规则哪些公开哪些要令牌)
- [二、认证：登录 / 退出 / 我是谁](#二认证登录--退出--我是谁)
- [三、资料 profile](#三资料-profile)
- [四、随笔 essay](#四随笔-essay)
- [五、发帖 post](#五发帖-post)
- [六、健康检查](#六健康检查)
- [七、字段来源对照表（最有用的一页）](#七字段来源对照表最有用的一页)
- [八、调用示例](#八调用示例)
- [九、前端必须遵守的 3 条约定](#九前端必须遵守的-3-条约定)

---

## 〇、通用约定

| 项 | 规定 |
|---|---|
| 后端地址 | `http://localhost:8080`（前端 `app.js` 里叫 `API_BASE`） |
| 数据格式 | 一律 JSON；POST / PUT 必须带 `Content-Type: application/json` |
| 编码 | UTF-8（后端已强制声明，中文不会乱码） |
| 跨域 CORS | 所有控制器都是 `@CrossOrigin(origins = "*")`（学习阶段先全放开，上线前要收紧） |
| 日期格式 | `LocalDate` → `"2026-09-16"`；`LocalDateTime` → `"2026-09-16T19:25:12.081"` |
| 令牌怎么带 | 请求头 `Authorization: Bearer <令牌>`（注意 `Bearer` 后面有一个空格） |

**失败的统一样子**

| 状态码 | 什么时候 | 返回体 |
|---|---|---|
| `401` | 密码不对（登录时） | `{"ok":false,"message":"密码不对"}` |
| `401` | 没带令牌 / 令牌无效或过期（**所有 `/api/admin/**`**） | `{"ok":false,"message":"需要站长令牌"}` |
| `404` | 改 / 删一个不存在的 id | 空响应体 |
| `500` | 数据库拒绝（例如正文为空，但 `body` 不允许为空） | Spring 默认错误页 |

---

## 一、门卫规则：哪些公开、哪些要令牌

`WebConfig` 里只写了一行：门卫守 `/api/admin/**`。

| 线路 | 谁可以调 | 本例中的地址 |
|---|---|---|
| 🟢 门外（公开） | 任何人 | `/api/login`、`/api/logout`、`/api/hello`、`/api/profile`、`/api/essays`、`/api/posts` |
| 🔒 门内（要令牌） | 只有站长 | 所有以 `/api/admin/` 开头的地址 |

> **加新写接口的规矩**：只要地址写成 `/api/admin/xxx`，**自动被门卫保护**，一行鉴权代码都不用写。
> 而登录接口 `/api/login` 必须在门外 —— 否则就成了"没令牌不能登录、不登录拿不到令牌"的死循环。

---

## 二、认证：登录 / 退出 / 我是谁

### 1. `POST /api/login` —— 用密码换令牌（公开）

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `password` | string | ✅ | 站长密码（来自 `application-local.properties` 的 `app.owner.password`）|

```json
{ "password": "admin123" }
```

**成功** `200`

```json
{ "ok": true, "token": "a1b2c3d4e5f6...（32 位十六进制）", "hours": 12 }
```

**失败** `401` → `{"ok":false,"message":"密码不对"}`

> 令牌怎么来的：后端 `UUID.randomUUID()` 去掉横杠，存在**内存**里的 `Map<令牌, 过期时间>`。
> 所以：**重启后端 = 所有令牌失效 = 要重新登录**。

### 2. `POST /api/logout` —— 让令牌作废（带令牌）

请求头带 `Authorization: Bearer <令牌>`，无请求体。

**返回** `200` → `{"ok":true,"message":"令牌已作废"}`

### 3. `GET /api/admin/whoami` —— 验证"我真的进来了"（带令牌）

**返回** `200` → `{"ok":true,"role":"OWNER","message":"你好，站长。门卫放你进来了。"}`

> 前端用它做「自动恢复登录」：页面打开时，本地 `localStorage` 里若还存着令牌，就调一次 whoami；
> 通过 → 直接进编辑模式；`401` → 清掉令牌，当访客。

---

## 三、资料 profile

> 这张表**永远只有一行**（"我"这一份设置）。

### 1. `GET /api/profile` —— 读资料（公开）

**返回** `200`

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | |
| `name` | string | 显示名 |
| `tagline` | string | 一句话（头像下面那句） |
| `intro` | string | 简介正文，**可以多行**（用 `\n`） |
| `avatarPath` | string | 头像图片路径，如 `assets/img/avatar.jpg` |
| `heroPath` | string | 背景图路径 |
| `github` | string | GitHub 主页 |
| `updatedAt` | string | 最后修改时间 |

```json
{ "id":1, "name":"东魏轻松的芹菜", "tagline":"想用自己学过的东西做一点自己爱做的事",
  "intro":"计算机专业在读\n在做项目…", "avatarPath":"assets/img/avatar.jpg",
  "heroPath":"assets/img/hero-v4.jpg", "github":"https://github.com/xiaoxian33",
  "updatedAt":"2026-09-16T19:25:12.081" }
```

> 表里还没有数据时，返回**一个空对象**（不是 404），所以前端不用处理"找不到"。

### 2. `PUT /api/admin/profile` —— 改资料（带令牌）🔒

请求体字段（**全部可选**，`null` = 这次不改它）：

| 字段 | 类型 | 必填 | 最大长度 |
|---|---|---|---|
| `name` | string | | 80 |
| `tagline` | string | | 200 |
| `intro` | string | | TEXT |
| `avatarPath` | string | | 300 |
| `heroPath` | string | | 300 |
| `github` | string | | 300 |

**行为**：表里有那一行就改它；没有就新建一行；顺手把 `updatedAt` 设成现在。
**返回** `200` → 更新后的整个 Profile 对象。

**✅ 只改简介的写法**（其他字段不发或发 null 都行）：

```json
{ "intro": "只改这一句，别的都不动" }
```

---

## 四、随笔 essay

### 1. `GET /api/essays` —— 读全部随笔（公开）

**排序**：按 `writtenOn` **从早到晚**（`findAllByOrderByWrittenOnAsc`）

**返回** `200` → 数组，每项字段：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | |
| `writtenOn` | string(date) | 写下的日期，**数据库列名是 `written_on`** |
| `title` | string | 标题，**可以为空** |
| `body` | string | 正文，**不能为空**；段落之间用**空行**分隔 |
| `sortOrder` | number | 排序序号，数字小的排前面 |

### 2. `POST /api/admin/essays` —— 新增一篇（带令牌）🔒

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `writtenOn` | string(date) | | 不写就默认**今天** |
| `title` | string | | 可以没有 |
| `body` | string | ✅ | 不能为空，否则数据库报 500 |

**行为**：`sortOrder` 自动设为"当前最大 + 1"（新的一篇排最后）。
**返回** `200` → 新建好的 Essay 对象（含 `id`）。

### 3. `PUT /api/admin/essays/{id}` —— 改一篇（带令牌）🔒

| 字段 | 类型 | 说明 |
|---|---|---|
| `writtenOn` | string(date) | 只在**非 null** 时更新 |
| `title` | string | ⚠️ **无条件覆盖**（发 null 就会把它清空） |
| `body` | string | ⚠️ **无条件覆盖**，而且**不能为空** → 发 null 会 500 |

> ⚠️ 正因为这两个是"无条件覆盖"，**前端改随笔时必须把 `title` 和 `body` 都带上**（哪怕没改）。
> 返回 `200` → 更新后的 Essay；id 不存在 → `404`。

### 4. `DELETE /api/admin/essays/{id}` —— 删一篇（带令牌）🔒

返回 `200` → `{"ok":true,"deleted":3}`；id 不存在 → `404`。

---

## 五、发帖 post

### 1. `GET /api/posts` —— 读全部帖子（公开）

**排序**：按 `publishedAt` **从新到旧**（`findAllByOrderByPublishedAtDesc`）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | number | |
| `title` | string | 可以没有（允许只发一段话） |
| `body` | string | 正文，**不能为空** |
| `tags` | string | **一个字符串**，逗号分隔，如 `"学习,Java"`（不是数组！） |
| `publishedAt` | string(date) | 页面显示的日期，数据库列名 `published_at` |
| `createdAt` | string(datetime) | 真正创建的时间，数据库列名 `created_at` |

> ⚠️ 前端必知的坑：`tags` 后端给的是**字符串** `"学习,Java"`，而页面要的是**数组** `["学习","Java"]`，
> 所以 `postFromApi()` 里有一层翻译（`split(',')` + `trim` + 去空）。

### 2. `POST /api/admin/posts` —— 发一条（带令牌）🔒

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `title` | string | | 可以没有 |
| `body` | string | ✅ | 不能为空 |
| `tags` | string | | 逗号分隔，如 `"学习,Spring"` |
| `publishedAt` | string(date) | | 不写就默认**今天** |

**返回** `200` → 新建好的 Post（含 `id`、`createdAt`）。

### 3. `PUT /api/admin/posts/{id}` —— 改一条（带令牌）🔒

| 字段 | 类型 | 说明 |
|---|---|---|
| `title` | string | ⚠️ **无条件覆盖** → 前端必须一起带上 |
| `body` | string | 只在非 null 时更新 |
| `tags` | string | ⚠️ **无条件覆盖** → 前端必须一起带上（没标签就发 `""`） |
| `publishedAt` | string(date) | 只在非 null 时更新 |

返回 `200` → 更新后的 Post；id 不存在 → `404`。

### 4. `DELETE /api/admin/posts/{id}` —— 删一条（带令牌）🔒

返回 `200` → `{"ok":true,"deleted":5}`；id 不存在 → `404`。

---

## 六、健康检查

| 方法 | 地址 | 权限 | 返回 |
|---|---|---|---|
| `GET` | `/` | 公开 | 纯文字：`后端已启动 ✅  试试访问 /api/hello` |
| `GET` | `/api/hello` | 公开 | `{"message":"你好，这里是张书贤的后端","time":"2026-09-16T19:25:12.081","status":"ok"}` |

> 前端页脚的"后端已连接"就是靠 `/api/hello` 判断的（超过 4 秒没回应就当没连上）。

---

## 七、字段来源对照表（最有用的一页）

**同一个东西，在三个地方可能有三个名字** —— 对不上账就是从这里开始的：

### 发帖 post

| 页面上的东西 | JSON 字段（前端用这个） | Java 字段 | 数据库列 |
|---|---|---|---|
| 标题 | `title` | `Post.title` | `title` |
| 正文 | `body` | `Post.body` | `body` |
| 标签 | `tags`（字符串） | `Post.tags` | `tags` |
| 日期 | `publishedAt` | `Post.publishedAt` | **`published_at`** |
| 创建时间 | `createdAt` | `Post.createdAt` | **`created_at`** |

### 随笔 essay

| 页面上的东西 | JSON 字段 | Java 字段 | 数据库列 |
|---|---|---|---|
| 日期 | `writtenOn` | `Essay.writtenOn` | **`written_on`** |
| 标题 | `title` | `Essay.title` | `title` |
| 正文 | `body` | `Essay.body` | `body` |
| 排序 | `sortOrder` | `Essay.sortOrder` | **`sort_order`** |

### 资料 profile

| 页面上的东西 | JSON 字段 | Java 字段 | 数据库列 |
|---|---|---|---|
| 显示名 | `name` | `Profile.name` | `name` |
| 一句话 | `tagline` | `Profile.tagline` | `tagline` |
| 简介 | `intro` | `Profile.intro` | `intro` |
| 头像 | `avatarPath` | `Profile.avatarPath` | **`avatar_path`** |
| 背景图 | `heroPath` | `Profile.heroPath` | **`hero_path`** |
| GitHub | `github` | `Profile.github` | `github` |
| 修改时间 | `updatedAt` | `Profile.updatedAt` | **`updated_at`** |

**三条规律**（记住就不用每次查）：
1. **JSON 字段名 = Java getter 去掉 `get` 首字母小写**（`getPublishedAt()` → `publishedAt`）—— 这是 Jackson 自动做的。
2. **数据库列名 = 注解里写的**（`@Column(name = "published_at")`）；没写注解的就是字段名的下划线形式。
3. **只有 `id`、`title`、`body`、`tags` 这种单个单词三边完全同名**，别的都容易差一点 —— 所以这张表要一直维护。

---

## 八、调用示例

### 用 curl 测（后端在 localhost:8080）

```bash
# 1) 登录拿令牌
curl -s -X POST http://localhost:8080/api/login \
     -H "Content-Type: application/json" \
     -d "{\"password\":\"admin123\"}"

# 2) 发一条帖子（把上一步返回的 token 粘进来）
curl -s -X POST http://localhost:8080/api/admin/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 把令牌粘在这里" \
     -d "{\"title\":\"第一条真帖子\",\"body\":\"正文\",\"tags\":\"学习,Spring\",\"publishedAt\":\"2026-09-16\"}"

# 3) 读回来看
curl -s http://localhost:8080/api/posts

# 4) 故意不带令牌写一次 —— 应该看到 401，说明门卫还在值班
curl -s -X POST http://localhost:8080/api/admin/posts \
     -H "Content-Type: application/json" -d "{\"body\":\"偷发一条\"}"
```

### 前端 JS 的写法（也就是第 4 步要写的"发送管道"）

```js
// 所有写操作都从这里走：自动带令牌、自动 JSON、统一处理 401
fetch(API_BASE + '/api/admin/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + readToken()
  },
  body: JSON.stringify({ title: t, body: b, tags: g, publishedAt: d })
})
```

---

## 九、前端必须遵守的 3 条约定

1. **字段名严格照抄第七节的表**（尤其：`publishedAt` 不能写成 `date`；`tags` 是**字符串**不是数组）。
2. **`PUT` 要"整体提交"**：`post` 的 `title`/`tags`、`essay` 的 `title`/`body` 是"无条件覆盖"，
   所以改东西时这几个字段必须一起带上。
   👉 推荐做法：**拿到现有的整条数据 → 改其中一处 → 整条发回去**（这样最不容易出错）。
3. **收到 `401` 就退回访客模式**：清掉本地令牌 + 退出编辑模式 + 提示"登录已过期，请重新登录（↑+←）"，
   **不能白屏，也不能让人误以为保存成功了**。



