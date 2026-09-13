# 东魏轻松的芹菜的个人小站

> 左边一条导航，点一点就能了解我 —— 一个会慢慢长大的个人网站。

🔗 **在线看**：https://xiaoxian33.github.io

---

## 📖 这是什么

一个介绍我自己的网站。左边是导航条，进来第一眼是「关于我」。
内容基本都住在**数据库**里（随笔、资料、发帖），只有站长能改，访客只能读。

## 🧭 页面

| 页面 | 里面有什么 |
| --- | --- |
| 🎀 关于我 | 头像、一句话、简介、最近在学什么、近期发帖 |
| 🎓 教育经历 | 从北京到深圳，再到广州 |
| 🖤 兴趣爱好 | 游戏 / 音乐 / 动画 / 电影 —— 我真正把时间和情绪花掉的地方 |
| ✦ 专业技能 | 会什么、在学什么、还没解锁什么 |
| 🕸️ 做过的项目 | Cyber-Tunnel、这个站，以及踩过的坑 |
| ✒️ 随笔 | 2025 年到现在写下的东西 |
| ✉️ 发帖 | 学习心得和碎碎念（**我能发，访客只能看**） |
| 🫧 AI 分身 | 读过我所有文字的分身，可以直接问它关于我的事 —— **在做** |

**站长的入口藏在键盘里**：同时按住 `↑` 和 `←` 会出现密码框，登录之后才能发帖、改资料。

## 🛠️ 技术栈

| 层 | 用的什么 | 备注 |
| --- | --- | --- |
| 前端 | 原生 HTML / CSS / JS | 没有框架，一行行写出来的；黑 + 粉的「地雷系」配色 |
| 前端托管 | GitHub Pages | 纯静态，`index.html` 一个文件装了所有页面（用 `#锚点` 切换） |
| 后端 | Java 21 · Spring Boot 4.1.1 | 提供 `/api/**`，负责决定「谁能读、谁能写」 |
| 数据库 | MySQL 8 · Spring Data JPA (Hibernate) | 三张表：`essay` / `profile` / `post` |
| 密码 | BCrypt（spring-security-crypto） | 只引哈希这一个小模块，没有引整个 Spring Security |


## 🔒 设计上只做了一件事，但很关键

**把「读」和「写」从网址上分开：**

```
读： GET  /api/essays · /api/profile · /api/posts     → 公开，谁都能看
写： POST /api/admin/essays ……  + 令牌                → 🚪 门卫统一拦截
```

所有写接口都挂在 `/api/admin/**` 下面，被 `OwnerAuthInterceptor` 一起保护 ——
所以以后**每加一张新表，门卫一行都不用改**。

## 🗂️ 目录结构

```
.
├── index.html                  所有页面都在这一个文件里
├── assets/
│   ├── css/style.css           全站样式（配色变量集中在最上面的 :root）
│   ├── js/app.js               页面切换、渲染、分页、登录门卫、编辑模式
│   └── img/                    头像、背景图（source/ 里是原图）
├── server/                     后端（Spring Boot 项目，可以单独启动）
│   └── src/main/java/com/xiaoxian33/site/
│       ├── Essay / Profile / Post ……            实体类（= 数据库里的表）
│       ├── *Repository ……                       查询窗口
│       ├── *Controller ……                       读接口（公开）
│       ├── *AdminController ……                  写接口（走门卫）
│       ├── OwnerAuthService / Interceptor / WebConfig   门卫三件套
│       └── DataSeeder                           旧内容一次性搬进数据库
└── docs/                       文档（见文末）
```

## 🔌 接口一览

| 方法 | 网址 | 谁能用 |
| --- | --- | --- |
| POST | `/api/login` · `/api/logout` | 知道密码的人 / 登录者 |
| GET | `/api/admin/whoami` | 登录者（查令牌有没有过期） |
| GET | `/api/essays` · `/api/profile` · `/api/posts` | 公开 |
| POST / PUT / DELETE | `/api/admin/essays`、`/api/admin/essays/{id}` | 站长 |
| PUT | `/api/admin/profile` | 站长 |
| POST / PUT / DELETE | `/api/admin/posts`、`/api/admin/posts/{id}` | 站长 |

## ▶️ 本地跑起来

**后端**（需要先装好 MySQL，照着 [装库文档](docs/MYSQL-SETUP.md) 做）：

```bash
cd server
# 1) 在 src/main/resources/application-local.properties 里写两个密码（这个文件不进仓库）
#    spring.datasource.password=你的 MySQL 密码
#    app.owner.password=你想设的站长密码
# 2) 启动（第一次启动会自动建表，并把旧内容灌进数据库）
./mvnw spring-boot:run          # Windows 下用：.\mvnw.cmd spring-boot:run
# 3) 打开 http://localhost:8080/api/essays，应该能看到一串 JSON
```

**前端**：`index.html` 是纯静态的，双击就能看。
⚠️ 现在随笔和资料还**写死在页面里**，页面只调了 `/api/hello` 来显示「后端状态」；真正改成从数据库读，是下一步的事。

## 🤖 开发方式

这个项目是 **Vibe Coding** 做的：

- 我负责提需求、看效果、做判断、把每一块弄懂；
- AI（DeepSeek / Claude）负责把代码写出来。

学习过程记在 [我的问题笔记](docs/LEARNING-LOG.md) 里 —— **只记我问过的问题和答案**。

## 📌 路线图

- [x] 左侧导航 + 黑粉「地雷系」配色
- [x] 各页面骨架（关于我 / 教育经历 / 兴趣爱好 / 专业技能 / 做过的项目 / 随笔）
- [x] 隐藏入口（`↑` + `←`）+ 编辑模式界面
- [x] 后端接上 MySQL，随笔搬进数据库
- [x] 门卫：登录拿令牌，保护 `/api/admin/**`
- [x] 三张表 `essay` / `profile` / `post` 的读写接口全部打通
- [ ] **前端接上接口**：登录真的去调 `/api/login`，页面内容从数据库读
- [ ] 管理页能发帖、能改资料、能传图
- [ ] AI 分身：读过我所有文字，替我回答问题
- [ ] 部署到云服务器（域名 + HTTPS）

## 📚 文档

- 📐 [代码结构：一页看懂每个文件管什么](docs/代码结构.md)
- 🚀 [离上线还差什么 · 完整清单](docs/上线清单.md)
- 🐬 [在新电脑上装 MySQL、建库、搬数据](docs/MYSQL-SETUP.md)
- 📓 [我的问题笔记（只记我问过的）](docs/LEARNING-LOG.md)

## 📎 说明

个人项目，故意保持简单：不用框架、不堆组件，每一块都尽量让我自己讲得清楚。

⚠️ 一处**已知的临时方案**：前端那个站长密码（`assets/js/app.js` 里的 `admin123`）只挡君子不挡小人 —— **真正的安全在后端**：所有写接口都要令牌，在浏览器里改那个变量也改不动数据库。等前端接上 `/api/login` 之后就会删掉它。

© 2026 东魏轻松的芹菜
