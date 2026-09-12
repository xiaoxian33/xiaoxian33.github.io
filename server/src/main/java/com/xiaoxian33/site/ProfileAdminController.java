package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

/**
 * 资料的"写"接口（只有站长能用）
 * ------------------------------------------------------------
 * 🟢【核心】PUT /api/admin/profile
 *   - 表里有那一行 → 改它
 *   - 表里还没有 → 新建一行
 *   - 只改前端发过来的字段（null 就跳过），所以可以"只改简介"
 *
 * 网址是 /api/admin/** → 自动被门卫保护。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/profile")
public class ProfileAdminController {

    private final ProfileRepository repository;

    public ProfileAdminController(ProfileRepository repository) {
        this.repository = repository;
    }

    @PutMapping
    public Profile update(@RequestBody ProfileForm form) {
        Profile profile = repository.findFirstByOrderByIdAsc().orElseGet(Profile::new);

        if (form.name() != null) profile.setName(form.name());
        if (form.tagline() != null) profile.setTagline(form.tagline());
        if (form.intro() != null) profile.setIntro(form.intro());
        if (form.avatarPath() != null) profile.setAvatarPath(form.avatarPath());
        if (form.heroPath() != null) profile.setHeroPath(form.heroPath());
        if (form.github() != null) profile.setGithub(form.github());

        profile.setUpdatedAt(LocalDateTime.now());
        return repository.save(profile);
    }
}
