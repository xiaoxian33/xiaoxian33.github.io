# 🐬 新电脑上装 MySQL、建库、搬数据（逐步清单）

> 适用：Windows。照着从上往下做，每步都有"你应该看到什么"。
> 这份文档放在仓库里，就是为了让你在**另一台电脑上也能打开它照着做**。
>
> ✅ **本机当前状态**：已装 **MySQL 8.4.11 LTS**（ZIP 便携版），目录
> `C:\Program Files\MySQL\MySQL Server 8.4`，服务名 **`MySQL84`**（开机自启），
> 端口 **3306**，root 密码 **`123456`**，已建库 **`site_db`**（utf8mb4）。

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

### 方式 A：ZIP 便携版（✅ 本机采用，可脚本化、免安装程序弹窗）

1. 下载官网 8.4 LTS：
   `https://cdn.mysql.com/Downloads/MySQL-8.4/mysql-8.4.11-winx64.zip`
2. 解压，把里面的 `mysql-8.4.11-winx64` 文件夹重命名并放到：
   `C:\Program Files\MySQL\MySQL Server 8.4`
3. 新建配置文件 `C:\Program Files\MySQL\MySQL Server 8.4\my.ini`：

   ```ini
   [mysqld]
   basedir="C:/Program Files/MySQL/MySQL Server 8.4"
   datadir="C:/Program Files/MySQL/MySQL Server 8.4/data"
   port=3306
   character-set-server=utf8mb4
   collation-server=utf8mb4_unicode_ci
   default-storage-engine=INNODB
   max_connections=200
   lower_case_table_names=1

   [client]
   port=3306
   default-character-set=utf8mb4
   ```

4. **初始化数据目录**（会生成 `data\`，此时 root 还没有密码）：

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --defaults-file="C:\Program Files\MySQL\MySQL Server 8.4\my.ini" --initialize-insecure
   ```

5. **注册为 Windows 服务并启动**（需管理员权限）：

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --install MySQL84 --defaults-file="C:\Program Files\MySQL\MySQL Server 8.4\my.ini"
   sc.exe config MySQL84 start= auto
   Start-Service MySQL84
   ```

6. **设置 root 密码**（把 `123456` 换成你的密码）：

   ```powershell
   & "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root --skip-password -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';"
   ```

### 方式 B：官方 Installer（图形界面，想顺带装 Workbench 就选它）

1. 下载：**https://dev.mysql.com/downloads/installer/** → 选 **MySQL Installer for Windows**
2. 安装类型：`Server only`（只要数据库）；想装图形界面选 `Custom`，勾 `MySQL Server` + `MySQL Workbench`
3. 关键几步：
   - **Type and Networking**：`Development Computer`，**Port 保持 3306**
   - **Authentication Method**：默认 `Use Strong Password Encryption`
   - **Accounts and Roles**：⭐ 设置 root 密码（**一定要记住**）
   - **Windows Service**：服务名 `MySQL84`，勾开机自启
4. 验证：开始菜单 → **MySQL 8.4 Command Line Client** → 输密码 → 出现 `mysql>` 即成功

---

## 2. 新电脑：建库

登录（`mysql -u root -p`，本机已把 `bin` 加进 PATH，直接敲 `mysql` 即可）后执行：

```sql
CREATE DATABASE site_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
```

> `utf8mb4` 是为了能正常存中文和 emoji —— 建库时选对，以后少踩一个坑。
> （本机已建好 `site_db`，表结构等做"接 MySQL"那一步再给 SQL。）

---

## 3. 旧电脑：导出数据

`mysqldump` 位置：`C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe`

在 PowerShell 里（把 `库名` 换成实际名字）：

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqldump.exe" -u root -p --databases 库名 > D:\backup.sql
```

- `--databases` 会把「建库语句」也写进去 → 新电脑导入时**不用先手动建库**
- 备份**所有**库：把 `--databases 库名` 换成 `--all-databases`
- 只导**结构**不导数据：加 `--no-data`
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

（路径用 **正斜杠** `/`，或双反斜杠）

### 方法 B：用 cmd 窗口（不是 PowerShell！）

PowerShell 不支持 `<` 重定向：

```cmd
"C:\Program Files\MySQL\MySQL Server 8.4\bin\mysql.exe" -u root -p < D:\backup.sql
```

### 验证

```sql
SHOW DATABASES;   -- 能看到那个库
USE 库名;
SHOW TABLES;      -- 能看到表
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

> 顺带：`Get-Service MySQL84` 看服务状态；`Restart-Service MySQL84` 重启服务（需管理员）。

---

## 6. 两台电脑怎么保持"一致"

- **数据不会自动同步**。旧电脑改了数据，要重新导出 → 再导入新电脑。
- **表结构**：把建表 SQL 放进仓库（例如 `db/schema.sql`），两台机器执行同一份，结构就一致了。
- 想省事：把**一台当主力**，另一台只做参考/演示。
- 真正的"两边实时一致"只有一种做法：**数据库放在一台双方都能访问的服务器上**（云数据库），两边都连它 —— 这是以后网站上线后的正规方案。

---

## 7. 安全提醒 🔒

- 学习用的弱密码（比如 `123456`）**只限本机 localhost**，绝不要用它连公网数据库。
- **不要**把 3306 端口暴露到公网。数据库被扫描 → 删库勒索是真实高发事故。
- **不要**把密码提交到 GitHub（`.gitignore` 已排除 `application-local.properties`）。
- 备份文件含隐私数据，别传到公开的地方。

---

## 8. 备忘：以后后端要填的地方

等做"接 MySQL"那一步，配置会写成这样（到时候我会带你改）：

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/site_db
spring.datasource.username=root
spring.datasource.password=你的密码
```

> 这个配置文件**不进仓库**（密码不能上传）。
