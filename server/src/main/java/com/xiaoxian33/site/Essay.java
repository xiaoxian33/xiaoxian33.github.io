package com.xiaoxian33.site;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

/**
 * 随笔（一条 = 数据库里一行）
 * ------------------------------------------------------------
 * 🟢【核心】这个类就是"表的设计图"：
 *   @Entity  → 我要被存进数据库
 *   @Table   → 对应的表名（不写就是类名 essay）
 *   每个字段 = 表里的一个列
 *
 * 启动时 JPA 会按这个类自动建表（因为我们配了 ddl-auto=update）。
 */
@Entity
@Table(name = "essay")
public class Essay {

    /** 主键，自增 */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 写下的日期（只用日期，不带时间） */
    @Column(name = "written_on", nullable = false)
    private LocalDate writtenOn;

    /** 标题，可以没有 */
    @Column(length = 120)
    private String title;

    /** 正文：段落之间用空行分隔 */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    /** 排序用的序号，数字小的排前面 */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** JPA 需要一个空构造函数（🔸样板，不用管） */
    public Essay() {
    }

    public Essay(LocalDate writtenOn, String title, String body, Integer sortOrder) {
        this.writtenOn = writtenOn;
        this.title = title;
        this.body = body;
        this.sortOrder = sortOrder;
    }

    // 下面是 getter / setter（🔸样板，IDE 能自动生成）

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getWrittenOn() {
        return writtenOn;
    }

    public void setWrittenOn(LocalDate writtenOn) {
        this.writtenOn = writtenOn;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }
}
