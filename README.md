# 东魏轻松的芹菜的个人小站

个人网站。左侧导航切换页面，内容存在数据库里 —— 访客只读，站长可写。

在线地址：**https://xiaoxian33.github.io**

## 截图

![首页](docs/images/site-home.png)

## 亮点（技术上做了什么）

- **读写分离的接口设计**：读接口公开（`GET /api/essays · /api/profile · /api/posts`）；写接口统一挂 `/api/admin/**`，由 `OwnerAuthInterceptor` 一次拦截统一鉴权 —— 新增写接口**不用改任何安全代码**。
- **登录与令牌**：后端用 BCrypt 校验密码，发放 12 小时有效的 Bearer 令牌（UUID + 服务端内存存储）；前端只负责把令牌存进 `localStorage`，**安全边界始终在后端**。
- **图片上传**：multipart 校验（扩展名 + Content-Type + 5MB 上限）、后端生成随机文件名（防中文/空格/目录穿越）、按 `uploads/年/月/` 落盘、`/uploads/**` 静态映射；数据库里只存路径，并用一张 `image` 表（`owner_type` + `owner_id`）同时挂到帖子与随笔上。
- **接口契约文档驱动**：`docs/API.md` 是唯一事实来源 —— 字段名、类型、失败码，以及"不带 / 空数组 / 列表"三种字段更新语义都写清楚了，前端照着它实现。
- **验证方式**：curl 逐条断言接口（含 401、超大文件、错误类型的反例），无头浏览器（Edge `--headless --dump-dom`）模拟点击验证界面行为。
- **改帖 / 删帖也走同一套管道**：列表里的 ✏️🗑️ 由事件委托统一处理，令牌、JSON、401 只在 `authFetch()` 里写一次。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML / CSS / JS（无框架），托管在 GitHub Pages |
| 后端 | Java 21 · Spring Boot 4.1.1 |
| 数据库 | MySQL 8 · Spring Data JPA (Hibernate) |
| 鉴权 | BCrypt 密码哈希 + Bearer 令牌 |

## 页面

| 页面 | 内容 |
|---|---|
| 关于我 | 头像、简介、近期发帖 |
| 教育经历 | 教育时间线 |
| 兴趣爱好 | 游戏 / 音乐 / 动画 / 电影 |
| 专业技能 | 已掌握与在学 |
| 做过的项目 | Cyber-Tunnel、本站 |
| 随笔 | 2025 年至今 |
| 发帖 | 学习记录（站长可写）|
| AI 分身 | 规划中 |

站长入口：同时按住 `↑` 和 `←` 调出密码框。

## 接口设计

读接口公开；写接口统一挂在 `/api/admin/**` 下，由 `OwnerAuthInterceptor` 统一鉴权。

    读： GET  /api/essays · /api/profile · /api/posts          公开
    写： POST /api/admin/essays …  + Authorization: Bearer     站长

新增写接口只要放在 `/api/admin/` 下面，鉴权代码无需改动。

## 接口一览

| 方法 | 路径 | 权限 |
|---|---|---|
| `POST` | `/api/login`、`/api/logout` | 站长 |
| `GET` | `/api/admin/whoami` | 站长（校验令牌）|
| `GET` | `/api/essays`、`/api/profile`、`/api/posts` | 公开 |
| `POST` / `PUT` / `DELETE` | `/api/admin/essays`、`/api/admin/essays/{id}` | 站长 |
| `PUT` | `/api/admin/profile` | 站长 |
| `POST` / `PUT` / `DELETE` | `/api/admin/posts`、`/api/admin/posts/{id}` | 站长 |

## 目录结构

```
.
├── index.html             所有页面都在这个文件里（用 #锚点 切换）
├── start-backend.bat      双击启动后端（Windows）
├── assets/
│   ├── css/style.css      全站样式（配色变量集中在 :root）
│   ├── js/app.js          页面切换、列表渲染、分页、登录门卫
│   └── img/               头像、背景图
├── server/                后端（Spring Boot，可单独启动）
│   └── src/main/java/com/xiaoxian33/site/
│       ├── Essay / Profile / Post          实体类（对应数据库表）
│       ├── *Repository                     数据访问
│       ├── *Controller                     读接口（公开）
│       ├── *AdminController                写接口（走门卫）
│       ├── OwnerAuthService / OwnerAuthInterceptor / WebConfig   鉴权三件套
│       ├── AuthController                  登录 / 登出 / whoami
│       └── DataSeeder                      首次启动导入旧内容
└── docs/                  文档（见文末）
```

## 本地运行

前置：JDK 21、MySQL 8。

**1. 配置密码**

新建 `server/src/main/resources/application-local.properties`（该文件已被 `.gitignore` 排除）：

```properties
spring.datasource.password=你的 MySQL 密码
app.owner.password=你想设的站长密码
```

**2. 启动后端**（两种方式任选）

- Windows：双击根目录的 `start-backend.bat`
- 命令行：

  ```bash
  cd server
  ./mvnw spring-boot:run        # Windows: .\mvnw.cmd spring-boot:run
  ```

首次启动会自动建表，并把旧内容导入数据库。
启动成功的标志：日志出现 `Started SiteServerApplication`。

**3. 打开前端**

`index.html` 是纯静态页面，直接双击即可（需后端在 `localhost:8080` 运行）。

验证接口：`http://localhost:8080/api/posts`

## 路线图

- [x] 左侧导航 + 黑粉配色
- [x] 各页面骨架
- [x] 隐藏入口（`↑` + `←`）+ 编辑模式界面
- [x] 后端接入 MySQL：随笔 / 资料 / 发帖三张表
- [x] 鉴权：登录拿令牌，保护 `/api/admin/**`
- [x] 前端读取数据（关于我 / 随笔 / 发帖）
- [x] 前端真登录（`POST /api/login`），移除本地占位密码
- [x] 管理页可发帖 / 改帖 / 删帖 / 写随笔 / 改随笔 / 删随笔 / 改资料
- [x] 图片上传：帖子与随笔都能配图（多张，含上传/预览/删除）
- [ ] 部署到云服务器（域名 + HTTPS）—— 12 步手册见 [上线手册](docs/上线手册.md)
- [ ] AI 分身

## 文档

- [接口契约](docs/API.md) —— **每个接口要什么字段、还什么字段、什么时候会失败**（写代码前先看它）
- [代码结构](docs/代码结构.md) —— 一页看懂每个文件管什么
- [上线手册](docs/上线手册.md) —— 12 步搬上服务器（含命令、验收、排错表）
- [项目暂停点](docs/项目暂停点.md) —— 停下来再接上时从哪继续
- [技能觉醒录](docs/技能觉醒录.md) —— 这个项目用到过的 49 个专业技能点（附人话解释与出处）
- [上线清单](docs/上线清单.md) —— 离上线还差什么
- [图片功能计划](docs/图片功能计划.md) —— 帖子多图功能的设计与改动清单
- [我的问题笔记](docs/LEARNING-LOG.md) —— 学习过程中问过的问题和答案（含每日记录）

## 说明

个人项目，有意保持简单：不用前端框架、不堆组件。

`assets/js/app.js` 里**已经没有本地占位密码**了：站长密码只在后端校验
（见 `OwnerAuthService`），前端只负责"把密码发给 `/api/login`、把换来的令牌存进 `localStorage`"。
所以改前端任何变量都不能写入数据库 —— **安全边界在后端**，不在前端。

接口的字段约定见 [docs/API.md](docs/API.md)。

© 2026 东魏轻松的芹菜
