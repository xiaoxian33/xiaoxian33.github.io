package com.xiaoxian33.site;

/**
 * 修改资料时，前端发过来的数据
 * ------------------------------------------------------------
 * 🔸【样板】只装数据的小盒子。哪个字段是 null，就表示"这次不改它"。
 */
public record ProfileForm(
        String name,
        String tagline,
        String intro,
        String avatarPath,
        String heroPath,
        String github) {
}
