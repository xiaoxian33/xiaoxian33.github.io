package com.xiaoxian33.site;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 图片表的"查询窗口"
 * ------------------------------------------------------------
 * 🟢【核心】方法名 = 查询，和 PostRepository 一样：
 *   findByOwnerTypeOrderBySortOrderAsc
 *     → SELECT * FROM image WHERE owner_type = ? ORDER BY sort_order ASC
 */
public interface ImageRepository extends JpaRepository<Image, Long> {

    /** 某一种内容下的所有图（读接口一次全查出来，再按 owner_id 分组，避免一条一条查） */
    List<Image> findByOwnerTypeOrderBySortOrderAsc(String ownerType);

    /** 某一条内容的所有图，按顺序 */
    List<Image> findByOwnerTypeAndOwnerIdOrderBySortOrderAsc(String ownerType, Long ownerId);
}
