package com.xiaoxian33.site;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 发帖（一条 = 数据库里一行）
 * ------------------------------------------------------------
 * 🟢【核心】和「随笔」几乎一样，区别是：
 *   随笔 = 过去的旧文（一次性搬进来的）
 *   帖子 = 你以后随时在管理页里发的
 * 所以它多了一个"发布时间"和"创建时间"。
 */
@Entity
@Table(name = "post")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 标题，可以没有（允许只发一段话） */
    @Column(length = 200)
    private String title;

    /** 正文 */
    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    /** 标签，先简单地用逗号隔开，例如：学习,Java */
    @Column(length = 200)
    private String tags;

    /** 标在页面上的日期（默认今天） */
    @Column(name = "published_at")
    private LocalDate publishedAt;

    /** 真正被创建的时间 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public Post() {
    }

    public Post(String title, String body, String tags, LocalDate publishedAt) {
        this.title = title;
        this.body = body;
        this.tags = tags;
        this.publishedAt = publishedAt;
        this.createdAt = LocalDateTime.now();
    }

    // getter / setter（🔸样板）

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getTags() {
        return tags;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public LocalDate getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDate publishedAt) {
        this.publishedAt = publishedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
