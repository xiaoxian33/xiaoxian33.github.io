package com.xiaoxian33.site;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 旧文导入器（只跑一次）
 * ------------------------------------------------------------
 * 🟢【核心】做的事：
 *   服务启动时看一眼 essay 表 —— 如果是空的，就灌两条【示例】随笔进去（默认「仅自己可见」）；
 *   如果已经有数据，就什么都不做（不会重复插入）。
 *
 * ⚠️ 这里以前放的是我自己的私人随笔原文 ✗ —— 已经全部移走了 ✓
 *    原因：这个文件属于公开仓库，私人文字不该出现在里面 ✓
 *    真实内容只存在数据库里（上线时从旧 HTML 导入过一次）；导出/恢复见 notes/备份与恢复.md ✓
 *
 * 以后你在管理页里自己增删改，这段代码就用不上了。
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final EssayRepository essayRepository;
    private final ProfileRepository profileRepository;

    public DataSeeder(EssayRepository essayRepository, ProfileRepository profileRepository) {
        this.essayRepository = essayRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    public void run(String... args) {
        seedEssays();
        seedProfile();
    }

    /** 把旧文搬进 essay 表（只搬一次） */
    private void seedEssays() {
        long existing = essayRepository.count();
        if (existing > 0) {
            System.out.println("[DataSeeder] essay 表已有 " + existing + " 篇，跳过导入");
            return;
        }

        // 🔒 示例随笔：不是真人的私人文字 —— 真实内容只存在数据库里 ✓
        //    新库灌进来的这两条默认就是「仅自己可见」，只有站长登录后才看得到 ✓
        List<Essay> essays = List.of(
            new Essay(LocalDate.of(2026, 1, 1), "第一篇随笔", """
                这里是随笔的示例内容。登录站长模式后，在「随笔」里点 ✏️ 就能把它改成你自己的文字。

                段落之间空一行，页面上就会分段。
                """.strip(), 1),

            new Essay(LocalDate.of(2026, 1, 2), "第二篇随笔", """
                再留一篇示例，方便你对照「日期 + 排序」的效果。不需要就直接删掉。
                """.strip(), 2)
        );

        // 🔒 种子数据一律设为「仅自己可见」：万一数据库重建，也不会把你的文字公开出去 ✓
        essays.forEach(e -> e.setVisibility("private"));

        essayRepository.saveAll(essays);
        System.out.println("[DataSeeder] 已导入 " + essays.size() + " 篇示例随笔（默认仅自己可见）");
    }

    /** 把现在的资料（名字 / 一句话 / 简介 / 图片路径）搬进 profile 表（只搬一次） */
    private void seedProfile() {
        if (profileRepository.count() > 0) {
            System.out.println("[DataSeeder] profile 表已有资料，跳过");
            return;
        }

        Profile profile = new Profile();
        profile.setName("东魏轻松的芹菜");
        profile.setTagline("想用自己学过的东西做一点自己爱做的事");
        profile.setIntro("""
                计算机专业在读 ·
                在做项目、在慢慢看看不懂的代码，也在慢慢变成一个更好的人""");
        profile.setAvatarPath("assets/img/avatar.jpg");
        profile.setHeroPath("assets/img/hero-v4.jpg");
        profile.setGithub("https://github.com/xiaoxian33");
        // 默认色系 = 粉 · 地雷系（就是这个站原来的样子 ✓）
        // 站长在后台「🎨 站点外观」里可以换成 themes.css 里的任意一套 ✓
        profile.setTheme("pink");
        profile.setUpdatedAt(LocalDateTime.now());

        profileRepository.save(profile);
        System.out.println("[DataSeeder] 已写入 profile（我的资料）");
    }
}
