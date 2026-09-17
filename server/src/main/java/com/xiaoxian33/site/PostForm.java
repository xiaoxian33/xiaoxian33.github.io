package com.xiaoxian33.site;

import java.time.LocalDate;
import java.util.List;

/**
 * 发帖 / 改帖时，前端发过来的数据
 * ------------------------------------------------------------
 * 🔸【样板】接口约定：
 *   { "title": "标题（可省略）", "body": "正文", "tags": "学习,Java",
 *     "publishedAt": "2026-09-12", "images": ["uploads/2026/09/a.jpg"] }
 *
 * 🖼️ images 是【路径字符串】的数组，顺序就是页面上的先后顺序；
 *   它是"整条提交"里的成员：改帖时不带 images → 图片保持原样；
 *   带 images: [] → 等于把图都删掉。想加图就得把老图一起带上。
 */
public record PostForm(String title, String body, String tags, LocalDate publishedAt, List<String> images) {
}
