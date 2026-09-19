# 代码结构（一页看懂）

> 目的：以后你自己打开这个项目，能立刻知道"哪个文件管什么"。

## 一、先看"一次请求走了哪条路"

**读**（谁都能看）：

```
浏览器
  │  GET /api/essays
  ▼
① Controller（接待）        EssayController
  │  喊一声
  ▼
② Repository（查询窗口）    EssayRepository
  │  方法名被翻译成 SQL：SELECT * FROM essay ORDER BY date_at DESC
  ▼
③ MySQL 里的表              essay
  │
  ▼
返回 JSON ↑（Java 对象 → Jackson → JSON 文字）
```

**写**（只有站长能改，多一道门卫）：

```
浏览器
  │  PUT /api/admin/essays/3   +   Authorization: Bearer <令牌>
  ▼
🚪 OwnerAuthInterceptor（门卫）：令牌对不对？
  │   不对 → 直接 401 挡回去（后面的代码根本不会跑）
  │   对   → 放行
  ▼
EssayAdminController → EssayRepository → MySQL
```

## 二、目录树（server/src/main/java/com/xiaoxian33/site/）

```
SiteServerApplication.java   程序的入口（main 在这里）
HelloController.java         早期测试用，可以删

【表】实体类 —— 一个类 = 一张表
  Essay.java                 随笔表
  Image.java                 图片表（一张图 = 一行；owner_type 区分它是帖子还是随笔的图）
  Profile.java               资料表（永远只有一行：我的简介/头像/背景）
  Post.java                  帖子表

【查询窗口】—— 只会查自己那张表
  EssayRepository.java
  ImageRepository.java
  ProfileRepository.java
  PostRepository.java

【读接口】—— 公开，谁都能看
  EssayController.java       GET /api/essays
  ProfileController.java     GET /api/profile
  PostController.java        GET /api/posts

【写接口】—— 只有站长能改（网址带 /api/admin/ → 自动过门卫）
  EssayAdminController.java     POST/PUT/DELETE /api/admin/essays
  ProfileAdminController.java   PUT /api/admin/profile
  PostAdminController.java      POST/PUT/DELETE /api/admin/posts
  UploadController.java         POST /api/admin/uploads（传一张图 → 存盘 → 还回路径）

【前端发过来的小盒子】—— 只装数据，跟表分开
  EssayForm.java
  ProfileForm.java
  PostForm.java

【给前端看的形状】—— 实体 + 图片 = 接口真正还出去的东西
  EssayView.java             一篇随笔（表里的字段 + 它的图片路径数组）
  PostView.java              一条帖子（同上）

【帮工】—— 干"多张表凑一件事"的活
  ImageService.java          读写 image 表：查图片、整条替换、跟着内容一起删

【门卫】
  OwnerAuthService.java       管密码（哈希）、发令牌、验令牌
  OwnerAuthInterceptor.java   每个请求先问它
  WebConfig.java              告诉 Spring：/api/admin/** 要过门卫；/uploads/** 直接当文件读
  AuthController.java         登录 / 登出 / 我是谁

DataSeeder.java               一次性把旧内容搬进表（表里已有数据就跳过）
```

配置文件（`src/main/resources/`）：

```
application.properties         公共设置（数据库地址、JPA 行为、上传目录、上传大小上限）→ 进仓库
application-local.properties   🔒 各种密码 → 不进仓库（.gitignore）
```

上传的图片落在哪：

```
server/uploads/年/月/随机名.png      运行时产生 → 不进仓库（server/.gitignore 里排除了）
```

## 三、一句话记住每个文件的角色

| 文件长相 | 它是什么 | 一句话 |
|---|---|---|
| `Xxx.java` | 表 | 这张表有哪些字段 |
| `XxxRepository.java` | 查询窗口 | 怎么查这张表 |
| `XxxController.java` | 读接口 | 大家能看 |
| `XxxAdminController.java` | 写接口 | 我能改 |
| `XxxForm.java` | 小盒子 | 前端发过来的数据长什么样 |
| `XxxView.java` | 形状 | 接口还出去的样子（**和表不一定一样**，比如多一个 `images`） |
| `XxxService.java` | 帮工 | 几件事凑成一件事（现在只有图片用） |
| `DataSeeder.java` | 搬运工 | 旧数据只搬一次 |

## 四、以后"加一张新表"就是这 5 步

1. 写 `Xxx.java`（表）
2. 写 `XxxRepository.java`（查询窗口）
3. 写 `XxxForm.java`（小盒子）
4. 写 `XxxController.java`（读，公开）
5. 写 `XxxAdminController.java`（写，走门卫）

→ 重启后端，表**自动建好**（`spring.jpa.hibernate.ddl-auto=update`）
→ 门卫不用再写，因为网址是 `/api/admin/xxx`，早就被 `WebConfig` 统一保护了

## 五、现在的接口清单

| 方法 | 网址 | 谁能用 |
|---|---|---|
| POST | `/api/login` | 知道密码的人 |
| POST | `/api/logout` | 登录者 |
| GET | `/api/admin/whoami` | 登录者（用来测令牌有没有过期） |
| GET | `/api/essays` | 公开 |
| POST / PUT / DELETE | `/api/admin/essays`、`/api/admin/essays/{id}` | 站长 |
| GET | `/api/profile` | 公开 |
| PUT | `/api/admin/profile` | 站长 |
| GET | `/api/posts` | 公开 |
| POST / PUT / DELETE | `/api/admin/posts`、`/api/admin/posts/{id}` | 站长 |
| POST | `/api/admin/uploads` | 站长（传图片，表单字段名 `file`） |
| GET | `/uploads/**` | 公开（上传后的图片文件本身） |
| GET | `/hello` | 测试用 |

## 六、还没做的（下一步清单）

- 「做过的项目」那一块页面（计划：只放简介 + GitHub 链接，不放图）
- 清理没人用的图片文件（选完图没保存、删了内容之后，磁盘上的文件还留着）
- 头像 / 背景图现在还是写死的路径（`assets/img/`），以后也可以改成上传
- 令牌存进数据库表（现在在内存里，重启后端就要重新登录）
- 把后端部署到服务器（现在只能在你自己电脑上跑）
