package com.xiaoxian33.site;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 接口里"一条帖子"长什么样（读接口和写接口都还这个形状）
 * ------------------------------------------------------------
 * 🟢【核心】为什么不直接把 Post 实体返回出去？
 *   因为"表里的形状"和"接口要还的形状"本来就可以不一样：
 *   图片存在另一张表（image）里，Post 实体身上没有这个字段。
 *   View = 专门给前端看的形状 → 于是接口契约就写在这个文件上。
 *
 * 注意字段名：JSON 里就是这些名字（Jackson 按 record 的名字来）。
 * 改这里 = 改接头点 → 必须同步改 docs/API.md 和前端的翻译层。
 */
public record PostView(
        Long id,
        String title,
        String body,
        String tags,
        LocalDate publishedAt,
        LocalDateTime createdAt,
        List<String> images
) {
    /** 把实体 + 它的图片路径，合成前端要的形状 */
    public static PostView of(Post post, List<String> images) {
        return new PostView(
                post.getId(),
                post.getTitle(),
                post.getBody(),
                post.getTags(),
                post.getPublishedAt(),
                post.getCreatedAt(),
                images);
    }
}
