package com.xiaoxian33.site;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 发帖表的"查询窗口"
 * ------------------------------------------------------------
 * 🟢【核心】方法名 = 查询：
 *   findAllByOrderByPublishedAtDesc → SELECT * FROM post ORDER BY published_at DESC
 */
public interface PostRepository extends JpaRepository<Post, Long> {

    /** 全部帖子，新的排前面 */
    List<Post> findAllByOrderByPublishedAtDesc();
}
