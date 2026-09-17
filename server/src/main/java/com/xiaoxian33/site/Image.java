package com.xiaoxian33.site;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * 图片（一行 = 一张图，属于某一条帖子或某一条随笔）
 * ------------------------------------------------------------
 * 🟢【核心】为什么不做 post_image / essay_image 两张表？
 *   "给一条内容配几张图"这两件事一模一样，所以用一张通用表 + owner_type 区分：
 *     owner_type = "post"  + owner_id = 5  → 第 5 条帖子的图
 *     owner_type = "essay" + owner_id = 3  → 第 3 篇随笔的图
 *   以后再加第三种内容（比如「做过的项目」），也不用再建表。
 *
 * ⚠️ 这里只存【路径】，图片文件本身躺在磁盘上（谁负责写盘：UploadController）。
 *     数据库：  image.path = "uploads/2026/09/abc.jpg"
 *     磁盘上：  server/uploads/2026/09/abc.jpg
 */
@Entity
@Table(name = "image")
public class Image {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 这张图挂在哪种内容下：post = 帖子，essay = 随笔 */
    @Column(name = "owner_type", length = 20, nullable = false)
    private String ownerType;

    /** 挂在哪一条上（那一行内容的 id） */
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    /** 文件路径，例如 uploads/2026/09/abc.jpg（前端拼上后端地址就能访问） */
    @Column(length = 255, nullable = false)
    private String path;

    /** 排序：数字小的排前面（同一条内容里，图片的先后顺序） */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /** 上传时间 */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /** JPA 需要一个空构造函数（🔸样板） */
    public Image() {
    }

    public Image(String ownerType, Long ownerId, String path, Integer sortOrder) {
        this.ownerType = ownerType;
        this.ownerId = ownerId;
        this.path = path;
        this.sortOrder = sortOrder;
        this.createdAt = LocalDateTime.now();
    }

    // 下面是 getter / setter（🔸样板）

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
