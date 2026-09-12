package com.xiaoxian33.site;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * 我的资料（这张表永远只有一行）
 * ------------------------------------------------------------
 * 🟢【核心】和「随笔」的区别：
 *   随笔 = 多行（一篇一行）
 *   资料 = 单行（就只有我这一份"设置"）
 *
 * 所以读取时用 findAll().stream().findFirst() 取那一行；
 * 写入时如果没有，就新建一行。
 */
@Entity
@Table(name = "profile")
public class Profile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 显示名 */
    @Column(length = 80)
    private String name;

    /** 一句话（头像下面那句） */
    @Column(length = 200)
    private String tagline;

    /** 简介正文，可以多行 */
    @Column(columnDefinition = "TEXT")
    private String intro;

    /** 头像图片的路径 */
    @Column(name = "avatar_path", length = 300)
    private String avatarPath;

    /** 背景图的路径 */
    @Column(name = "hero_path", length = 300)
    private String heroPath;

    /** GitHub 主页 */
    @Column(length = 300)
    private String github;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Profile() {
    }

    // getter / setter（🔸样板）

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTagline() {
        return tagline;
    }

    public void setTagline(String tagline) {
        this.tagline = tagline;
    }

    public String getIntro() {
        return intro;
    }

    public void setIntro(String intro) {
        this.intro = intro;
    }

    public String getAvatarPath() {
        return avatarPath;
    }

    public void setAvatarPath(String avatarPath) {
        this.avatarPath = avatarPath;
    }

    public String getHeroPath() {
        return heroPath;
    }

    public void setHeroPath(String heroPath) {
        this.heroPath = heroPath;
    }

    public String getGithub() {
        return github;
    }

    public void setGithub(String github) {
        this.github = github;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
