package com.xiaoxian33.site;

import java.time.LocalDate;

/**
 * 新增 / 修改随笔时，前端发过来的数据
 * ------------------------------------------------------------
 * 🔸【样板】record 是 Java 的一种"只装数据的小盒子"写法，
 *   等价于"一个类 + 三个字段 + getter"，但只有一行。
 *
 * 它顺便就是"接口的约定"：前端要 POST 的东西必须长这样：
 *   { "writtenOn": "2026-09-12", "title": "标题（可省略）", "body": "正文" }
 */
public record EssayForm(LocalDate writtenOn, String title, String body) {
}
