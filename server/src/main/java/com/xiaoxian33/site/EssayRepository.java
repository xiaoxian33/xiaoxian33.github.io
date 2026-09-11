package com.xiaoxian33.site;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 随手记的"查询窗口"
 * ------------------------------------------------------------
 * 🟢【核心】这里不需要写 SQL！方法名本身就是查询语句：
 *   findAllByOrderByWrittenOnAsc  →  SELECT * FROM essay ORDER BY written_on ASC
 *
 * JPA 会按方法名自动生成实现（这叫"派生查询"）。
 */
public interface EssayRepository extends JpaRepository<Essay, Long> {

    /** 按写作日期从早到晚取全部随笔 */
    List<Essay> findAllByOrderByWrittenOnAsc();

    /** 按写作日期从晚到早 */
    List<Essay> findAllByOrderByWrittenOnDesc();
}
