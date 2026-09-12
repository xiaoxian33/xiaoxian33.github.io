package com.xiaoxian33.site;

import java.time.LocalDate;

/**
 * 发帖 / 改帖时，前端发过来的数据
 * ------------------------------------------------------------
 * 🔸【样板】接口约定：
 *   { "title": "标题（可省略）", "body": "正文", "tags": "学习,Java", "publishedAt": "2026-09-12" }
 */
public record PostForm(String title, String body, String tags, LocalDate publishedAt) {
}
