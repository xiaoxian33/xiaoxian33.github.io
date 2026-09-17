# 接口契约（API.md）

> **这份文件是干什么的**：前后端之间"接头点"的清单 —— 每个接口**要什么字段、还什么字段、什么时候会失败**。
> 写代码前先看它，改接口后同步改它。**不要再靠记忆**（上次就是没对账：前端的 `date` 和后端的 `publishedAt` 对不上）。
>
> 最后核对时间：2026-09-17（新增图片上传后重新核对过）

## 目录

- [〇、通用约定](#〇通用约定)
- [一、门卫规则：哪些公开、哪些要令牌](#一门卫规则哪些公开哪些要令牌)
- [二、认证：登录 / 退出 / 我是谁](#二认证登录--退出--我是谁)
- [三、资料 profile](#三资料-profile)
- [四、随笔 essay](#四随笔-essay)
- [五、发帖 post](#五发帖-post)
- [六、图片 upload](#六图片-upload)
- [七、健康检查](#七健康检查)
- [八、字段来源对照表（最有用的一页）](#八字段来源对照表最有用的一页)
- [九、调用示例](#九调用示例)
- [十、前端必须遵守的约定](#十前端必须遵守的约定)

---

## 〇、通用约定

| 项 | 规定 |
|---|---|
| 后端地址 | `http://localhost:8080`（前端 `app.js` 里叫 `API_BASE`） |
| 数据格式 | 一律 JSON；POST / PUT 必须带 `Content-Type: application/json` |
| **唯一例外** | `POST /api/admin/uploads`（传图片）用 `multipart/form-data`：前端**不要**自己写 `Content-Type`，浏览器要生成分隔文件的边界字符串 |
| 编码 | UTF-8（后端已强制声明，中文不会乱码） |
| 跨域 CORS | 所有控制器都是 `@CrossOrigin(origins = "*")`（学习阶段先全放开，上线前要收紧） |
| 日期格式 | `LocalDate` → `"2026-09-16"`；`LocalDateTime` → `"2026-09-16T19:25:12.081"` |
| 令牌怎么带 | 请求头 `Authorization: Bearer <令牌>`（注意 `Bearer` 后面有一个空格） |

**失败的统一样子**

| 状态码 | 什么时候 | 返回体 |
|---|---|---|
| `401` | 密码不对（登录时） | `{"ok":false,"message":"密码不对"}` |
| `401` | 没带令牌 / 令牌无效或过期（**所有 `/api/admin/**`**） | `{"ok":false,"message":"需要站长令牌"}` |
| `400` | 上传的图类型不对 / 超过 5MB / 文件是空的 | `{"ok":false,"message":"图太大了：6144KB，一张最多 5MB"}` |
| `404` | 改 / 删一个不存在的 id | 空响应体 |
| `500` | 数据库拒绝（例如正文为空，但 `body` 不允许为空） | Spring 默认错误页 |

> 前端 `authFetch()` 会把 `400` 里的 `message` **直接显示给用户**（比只说"HTTP 400"有用得多）。

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

## 六、图片 upload

> 帖子 / 随笔都能配图（可以多张，按选图顺序排）。
> **图片文件不进数据库** —— 数据库里只存路径，文件躺在硬盘上。

### 1. `POST /api/admin/uploads` —— 传一张图（带令牌）🔒

⚠️ **这是唯一一个不是 JSON 的接口**：请求体是 `multipart/form-data`，字段名必须是 `file`。

| 项 | 规定 |
|---|---|
| 字段名 | `file`（一次一张；要传多张就调多次） |
| 允许类型 | `jpg` / `jpeg` / `png` / `webp` / `gif`（扩展名和 `Content-Type` 都会查，只看一个都能骗过去） |
| 大小 | 单张 ≤ **5MB** |
| 文件名 | 后端自己生成随机名（不用你传来的名字 —— 防中文/空格/`../` 爬目录） |
| 存到哪 | `server/uploads/年/月/随机名.ext`（这个目录在 `.gitignore` 里，不进仓库） |

**成功** `200`

```json
{ "ok": true, "path": "uploads/2026/09/d8aa34b241bf4bc9ae08f8a0807b5977.png", "size": 70 }
```

**失败** `400` → `{"ok":false,"message":"图太大了：6144KB，一张最多 5MB"}`（类型不对 / 太大 / 文件是空的）

> `path` 是**相对路径**（前面没有 `/`）。前端要显示它，得自己拼上后端地址：
> `API_BASE + '/' + path` → `http://localhost:8080/uploads/2026/09/xxx.png`
> （前端已经封成了 `imgUrl(path)` 这一个函数。）

**图片怎么被访问到**：后端 `WebConfig` 把硬盘上的 `uploads` 目录挂到了网址 `/uploads/**`。
这条线**不在 `/api/admin/**` 里**，所以访客也能看图（本来就该这样）。

### 2. 图片怎么跟着帖子 / 随笔走

数据库里的 `image` 表（一张通用表，两种内容共用 —— 而不是 post_image / essay_image 两张）：

| 列 | 说明 |
|---|---|
| `owner_type` | `post` = 帖子，`essay` = 随笔 |
| `owner_id` | 挂在哪一条上 |
| `path` | 图片路径（就是上传接口还回来的那个） |
| `sort_order` | 顺序，数字小的排前面 |

**接口里的 `images` 字段 = 路径字符串数组**（发过去和读回来形状一样，前端最好处理）：

| 位置 | 多出来的东西 |
|---|---|
| `GET /api/posts` 每条帖子 | `images: ["uploads/2026/09/a.png", "..."]` |
| `GET /api/essays` 每篇随笔 | 同上 |
| `POST` / `PUT` `/api/admin/posts` | 请求体**可以**带 `images`（顺序 = 页面上的顺序） |
| `POST` / `PUT` `/api/admin/essays` | 同上 |

**`images` 的三条规矩**（和 `body` 那种"非 null 才更新"不一样，别搞混）：

| 你怎么发 | 结果 |
|---|---|
| **不带** `images` 这个字段 | 图片**保持原样**（不动） |
| `"images": []` | 这条内容的图**全部删掉** |
| `"images": ["a.png","b.png"]` | **整条替换**成这两张，顺序照你给的来 |

> 所以改内容时想加一张图 → 要把**老图一起带上**。
> 推荐做法：像别的字段一样"整条提交"（前端就是这么干的：读取时存一份原样数据，保存时整条发回去）。

### 3. 删内容时图片怎么办

`DELETE /api/admin/posts/{id}` · `DELETE /api/admin/essays/{id}` 会**顺手删掉 `image` 表里的记录**（不留孤儿）。
磁盘上的图片文件**先留着** —— 以后可以写个清理脚本打扫没人用的文件。
（还有个已知的小浪费：选完图又没保存 → 磁盘上多一个没人用的文件。同样是以后清理脚本的事。）

---

## 七、健康检查

| 方法 | 地址 | 权限 | 返回 |
|---|---|---|---|
| `GET` | `/` | 公开 | 纯文字：`后端已启动 ✅  试试访问 /api/hello` |
| `GET` | `/api/hello` | 公开 | `{"message":"你好，这里是张书贤的后端","time":"2026-09-16T19:25:12.081","status":"ok"}` |

> 前端页脚的"后端已连接"就是靠 `/api/hello` 判断的（超过 4 秒没回应就当没连上）。

---

## 八、字段来源对照表（最有用的一页）

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

### 图片 image

| 页面上的东西 | JSON 字段 | Java 字段 | 数据库列 |
|---|---|---|---|
| 这条内容的图片（数组） | `images` | `Image.path`（一张图 = 一行） | `path` |
| 是谁的图 | ——（接口里不出现） | `Image.ownerType` / `Image.ownerId` | **`owner_type`** / **`owner_id`** |
| 图片顺序 | 数组顺序 | `Image.sortOrder` | **`sort_order`** |

> ⚠️ `images` **不在** `post` / `essay` 表里，它在**另一张表** `image` 里。
> 接口返回的形状由 `PostView` / `EssayView` 两个 record 决定（实体 + 图片 = 给前端看的形状）。
> 这就是为什么这层要单独存在：**表里的形状 ≠ 接口要还的形状**（实体里没有 `images` 这个字段）。

**三条规律**（记住就不用每次查）：
1. **JSON 字段名 = Java getter 去掉 `get` 首字母小写**（`getPublishedAt()` → `publishedAt`）—— 这是 Jackson 自动做的。
2. **数据库列名 = 注解里写的**（`@Column(name = "published_at")`）；没写注解的就是字段名的下划线形式。
3. **只有 `id`、`title`、`body`、`tags` 这种单个单词三边完全同名**，别的都容易差一点 —— 所以这张表要一直维护。

---

## 九、调用示例

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

# 5) 传一张图（-F 会让 curl 自动用 multipart/form-data，别自己写 Content-Type）
curl -s -X POST http://localhost:8080/api/admin/uploads \
     -H "Authorization: Bearer 把令牌粘在这里" \
     -F "file=@D:/图片/猫.png;type=image/png"
# → {"ok":true,"path":"uploads/2026/09/xxx.png","size":12345}

# 6) 把这张图挂到帖子上（images 是路径数组，顺序就是显示顺序）
curl -s -X POST http://localhost:8080/api/admin/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 把令牌粘在这里" \
     -d "{\"title\":\"带图的帖子\",\"body\":\"正文\",\"tags\":\"\",\"images\":[\"uploads/2026/09/xxx.png\"]}"

# 7) 图片本身怎么访问（不用令牌，访客也能看）
curl -s -I http://localhost:8080/uploads/2026/09/xxx.png
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
  body: JSON.stringify({ title: t, body: b, tags: g, publishedAt: d, images: paths })
})
```

传文件的写法（唯一一个不是 JSON 的接口）：

```js
// 传文件时【千万不要】自己写 Content-Type ——
// 浏览器要生成一段"边界字符串"来分隔文件，我们写了反而把它搞坏
var form = new FormData();
form.append('file', file);                                   // 字段名必须是 file
fetch(API_BASE + '/api/admin/uploads', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + readToken() },      // 只带令牌，别的交给浏览器
  body: form
}).then(function (res) { return res.json(); })
  .then(function (data) { console.log(data.path); });         // 拿到路径，保存时带上
```

---

## 十、前端必须遵守的约定

1. **字段名严格照抄第八节的表**（尤其：`publishedAt` 不能写成 `date`；`tags` 是**字符串**不是数组）。
2. **`PUT` 要"整体提交"**：`post` 的 `title`/`tags`、`essay` 的 `title`/`body` 是"无条件覆盖"，
   所以改东西时这几个字段必须一起带上。
   👉 推荐做法：**拿到现有的整条数据 → 改其中一处 → 整条发回去**（这样最不容易出错）。
3. **收到 `401` 就退回访客模式**：清掉本地令牌 + 退出编辑模式 + 提示"登录已过期，请重新登录（↑+←）"，
   **不能白屏，也不能让人误以为保存成功了**。
4. **图片是"路径数组"，不是文件本身**：
   - 后端给的是**相对路径**（`uploads/2026/09/x.png`）→ 显示前必须拼上 `API_BASE`（前端封成了 `imgUrl()`）；
   - 上传接口是**唯一**用 `multipart/form-data` 的，别给它写 JSON 的 `Content-Type`；
   - 改内容时：**不带 `images` = 不动图**，带 `[]` = 清空，带列表 = 整条替换。



