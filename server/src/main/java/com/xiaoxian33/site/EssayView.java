package com.xiaoxian33.site;

import java.time.LocalDate;
import java.util.List;

/**
 * 接口里"一篇随笔"长什么样（读接口和写接口都还这个形状）
 * ------------------------------------------------------------
 * 🟢【核心】和 PostView 一个道理：实体里没有 images，
 *   所以另做一个"给前端看的形状"，多带一个图片路径数组。
 */
public record EssayView(
        Long id,
        LocalDate writtenOn,
        String title,
        String body,
        Integer sortOrder,
        String visibility,
        List<String> images
) {
    public static EssayView of(Essay essay, List<String> images) {
        return new EssayView(
                essay.getId(),
                essay.getWrittenOn(),
                essay.getTitle(),
                essay.getBody(),
                essay.getSortOrder(),
                essay.isPrivate() ? "private" : "public",
                images);
    }
}
