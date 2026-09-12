package com.xiaoxian33.site;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 资料表的"查询窗口"
 * ------------------------------------------------------------
 * 🟢【核心】单行表没有"按什么排序"的需求，
 *   所以这里只加了一个"取第一行"的方便方法。
 */
public interface ProfileRepository extends JpaRepository<Profile, Long> {

    /** 取那一行（单行表：第一篇就是全部） */
    Optional<Profile> findFirstByOrderByIdAsc();
}
