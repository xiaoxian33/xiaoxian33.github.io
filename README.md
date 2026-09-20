# 东魏轻松的芹菜的个人小站

个人网站 —— 左侧导航切换页面，内容存在数据库里：**访客只读，站长可写**。
原生 HTML/CSS/JS 前端 + Spring Boot / MySQL 后端，写接口由令牌统一鉴权。

**上线地址**：http://47.107.76.13 —— 前端 + 后端 + MySQL 都在一台云服务器上（Ubuntu 24.04 · Nginx · systemd）
**前端镜像**：https://xiaoxian33.github.io （GitHub Pages，同一份前端代码）

## 项目简介

一个"自己写、自己用"的个人站。页面全部是静态 HTML（**同一份代码既部署在云服务器上，也放在 GitHub Pages 做镜像**），内容存在自己的 MySQL 里：
**访客只读，站长在页面上登录后就能发帖、配图、写随笔、改资料。**

做它的初衷是**把学过的东西真的用一遍** —— 所以有意不用前端框架、不引重型依赖，
反倒是把"鉴权、上传、契约、部署"这些真正容易出错的地方逐个做扎实。

## 截图

![首页](docs/images/site-home.png)

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | 原生 HTML / CSS / JavaScript（无框架）；同一份代码部署在云服务器与 GitHub Pages |
| 后端 | Java 21 · Spring Boot · Spring Data JPA (Hibernate) |
| 数据库 | MySQL 8 |
| 部署 | 阿里云轻量（Ubuntu 24.04）· Nginx（静态 + 反代 `/api`）· systemd（开机自启 / 崩溃自愈） |
| 鉴权 | BCrypt 密码哈希 + Bearer 令牌；写接口统一挂 `/api/admin/**`，由拦截器一次鉴权 |

## 设计上的几个取舍（为什么这么做）

| 取舍 | 做法 | 为什么 |
|---|---|---|
| **鉴权只做一次** | 写接口全部挂在 `/api/admin/**` 下，一个拦截器统一守门 | 加新写接口不用碰安全代码，也不会漏守某一条 |
| **安全边界放后端** | 前端只负责"把密码发出去、把令牌存起来" | 前端代码是公开的，改前端变量也写不进数据库 |
| **图片只存路径** | 文件落磁盘（`uploads/年/月/`）+ `/uploads/**` 静态映射，库里只存相对路径 | 库小而快；图片能被浏览器当普通文件读；备份时数据和文件分开处理 |
| **一张通用图片表** | `image` 用 `owner_type` + `owner_id` 指向帖子或随笔 | 以后加第三种内容不用建新表，一套上传/删除代码共用 |
| **先定契约再写代码** | `docs/API.md` 写清字段名、类型、失败码，以及"不带 / 空数组 / 列表"三种字段更新语义 | 曾经因为字段名对不上账排查半天；现在改接口先改文档 |
| **请求只走一条管道** | 前端 `authFetch()` 里只写一次令牌、JSON、401 处理 | 8 个写动作各一行，改一处全局生效 |

## 功能

- 随笔 / 发帖 / 个人资料的展示（读接口公开）
- 站长在页面内完成增删改：发帖、改帖、删帖、写随笔、改随笔、删随笔、改资料
- 图片上传：帖子与随笔都能配多张图，支持预览与删除

## 接口

| 方法 | 路径 | 权限 |
|---|---|---|
| `GET` | `/api/essays` · `/api/profile` · `/api/posts` | 公开 |
| `POST` | `/api/login` · `/api/logout` · `/api/admin/whoami` | 站长 |
| `POST` / `PUT` / `DELETE` | `/api/admin/essays{/id}` · `/api/admin/posts{/id}` · `/api/admin/profile` | 站长 |
| `POST` | `/api/admin/uploads` | 站长（图片上传） |

字段名、类型与失败码见 [docs/API.md](docs/API.md)；`/uploads/**` 为公开的图片访问路径。

## 本地运行

前置：JDK 21、MySQL 8。

1. 在 `server/src/main/resources/application-local.properties` 里填数据库密码与站长密码（该文件已被 `.gitignore` 排除）
2. 启动后端：`cd server && ./mvnw spring-boot:run`（Windows：`.\mvnw.cmd spring-boot:run`），或双击根目录的 `start-backend.bat`
3. 打开 `index.html`（纯静态页面，需后端运行在 `localhost:8080`）

首次启动会自动建表。站长入口：同时按住 `↑` 和 `←`。

## 目录结构

    index.html                所有页面（用 #锚点 切换）
    assets/                   css / js / 图片
    server/                   Spring Boot 后端
      └ src/main/java/com/xiaoxian33/site/
          实体 → 仓库 → 读接口 → 写接口 → 鉴权三件套 → 上传
    docs/API.md               接口契约：要什么字段、还什么字段、什么时候失败
    docs/STRUCTURE.md         每个文件管什么（一页看完）

个人项目，有意保持简单：不用前端框架，不堆组件。
安全边界在后端 —— 前端只负责把密码发给 `/api/login`、把令牌存进 `localStorage`；改前端变量无法写入数据库。

文档只留两份：[接口契约](docs/API.md) · [代码结构](docs/STRUCTURE.md)。
其余（学习记录、部署手册、计划草稿）属于个人笔记，放在仓库外，不入库。
