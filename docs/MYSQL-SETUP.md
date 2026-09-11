# 🐬 新电脑上装 MySQL、建库、搬数据（逐步清单）

> 适用：Windows。照着从上往下做，每步都有"你应该看到什么"。
> 这份文档放在仓库里，就是为了让你在**另一台电脑上也能打开它照着做**。

---

## 0. 先记住三句话（很重要）

1. **每台电脑的 MySQL 是互相独立的**，账号密码也各自独立 —— 不存在"同步一个账号"这回事。
2. 能"同步"的是**数据**：导出成一个 `.sql` 文件 → 拷到新电脑 → 导入。
3. 密码是你自己定的。两台电脑**设成一样的**只是为了你自己好记。

| 东西 | 存在哪里 | 能同步吗 |
|---|---|---|
| MySQL 程序 | 每台电脑各装一份 | — |
| 账号 / 密码 | 各台电脑的 MySQL 内部 | ❌ 不能同步，但可以设成一样 |
| 数据（表里的内容） | 各台电脑的数据目录 | ✅ 用导出 / 导入来搬 |

---

## 1. 新电脑：安装 MySQL

1. 下载：官网 **https://dev.mysql.com/downloads/installer/** → 选 **MySQL Installer for Windows**（带 Server 的那个完整包）
2. 安装类型：选 **Server only**（只装数据库就够了）；想要图形界面就选 **Custom**，勾上 `MySQL Server` + `MySQL Workbench`
3. 关键几步这么选：
   - **Type and Networking**：Config Type 选 `Development Computer`；**Port 保持 3306**
   - **Authentication Method**：用默认的 `Use Strong Password Encryption`
   - **Accounts and Roles**：⭐ **设置 root 密码**（**一定要记住**；学习阶段可以和旧电脑一样，比如 `123456`）
   - **Windows Service**：服务名 `MySQL80`，勾选开机自启
   - 最后 `Apply Configuration` → 完成
4. 验证是否装好（二选一）：
   - 开始菜单搜 **MySQL 8.0 Command Line Client** → 打开 → 输密码 → 出现 `mysql>` 就是成功
   - 或在 PowerShell 里：
     ```powershell
     & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
     ```

---

## 2. 新电脑：建库

登录进 `mysql>` 之后，执行（`site_db` 换成你想用的库名）：

```sql
CREATE DATABASE site_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
```

> `utf8mb4` 是为了能正常存中文和 emoji —— 建库时选对，以后少踩一个坑。

（表结构等以后做"接 MySQL"那一步我再给你 SQL，现在不用建表。）

---

## 3. 旧电脑：导出数据

`mysqldump` 的位置：`C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe`

在 PowerShell 里（把 `库名` 换成实际名字，例如 `cyber_tunnel_db`）：

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u root -p --databases 库名 > D:\backup.sql
```

- `--databases` 会把「建库语句」也一起写进去 → 新电脑导入时**不用先手动建库**
- 想备份**所有**库：把 `--databases 库名` 换成 `--all-databases`
- 只想导**表结构**不导数据：在中间加一个 `--no-data`
- 回车后输入密码；导完把 `backup.sql` 拷到 U 盘 / 网盘

> ⚠️ `.sql` 文件里是**真实数据**，别随手丢到公开网盘。

---

## 4. 新电脑：导入数据

### 方法 A：在 mysql 客户端里 source（最稳）

```
mysql -u root -p
```
登录后：

```sql
source D:/backup.sql
```

（路径用 **正斜杠** `/`，或者用双反斜杠）

### 方法 B：用 cmd 窗口（不是 PowerShell！）

PowerShell 不支持 `<` 这个重定向符号：

```cmd
"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < D:\backup.sql
```

### 验证

```sql
SHOW DATABASES;      -- 能看到那个库
USE 库名;
SHOW TABLES;         -- 能看到表
```

---

## 5. 常用命令小抄

| 想干什么 | 命令 |
|---|---|
| 登录 | `mysql -u root -p` |
| 看所有库 | `SHOW DATABASES;` |
| 进入某个库 | `USE 库名;` |
| 看有哪些表 | `SHOW TABLES;` |
| 看表结构 | `DESC 表名;` |
| 看前 10 行 | `SELECT * FROM 表名 LIMIT 10;` |
| 退出 | `exit;` |

---

## 6. 两台电脑怎么保持"一致"

- **数据不会自动同步**。旧电脑改了数据，要重新导出 → 再导入新电脑。
- 想省事可以：把**一台当主力**，另一台只做参考/演示。
- 真正的"两边实时一致"只有一种做法：**数据库放在一台双方都能访问的服务器上**（云数据库），两边都连它 —— 这是以后网站上线后的正规方案。
- 表结构改了（加表、加字段）也要同步：可以先用 `--no-data` 只导结构。

---

## 7. 安全提醒 🔒

- 学习用的弱密码（比如 `123456`）**只限本机 localhost**，绝不要用它去连公网数据库。
- **不要**把 3306 端口暴露到公网。数据库被扫描 → 删库勒索是真实高发事故。
- **不要**把密码提交到 GitHub（我们的项目用环境变量，`.gitignore` 已经排除相关文件）。
- 备份文件含隐私数据，别传到公开的地方。

---

## 8. 备忘：以后后端要填的地方

等做"接 MySQL"那一步，配置会写成这样（到时候我会带你改）：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/site_db
spring.datasource.username=root
spring.datasource.password=你的密码
```

> 这个配置文件**不进仓库**（密码不能上传），忘了密码就回到本文档第 1 步第 3 点去看/重置。
