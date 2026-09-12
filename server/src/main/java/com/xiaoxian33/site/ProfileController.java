package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

/**
 * 资料的"读"接口（公开）
 * ------------------------------------------------------------
 * 🟢【核心】GET /api/profile → 一行资料
 *   表里还没有数据时，返回一个空对象（不是 404），
 *   这样前端不用处理"找不到"的情况。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileRepository repository;

    public ProfileController(ProfileRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public Profile get() {
        Optional<Profile> found = repository.findFirstByOrderByIdAsc();
        return found.orElseGet(Profile::new);
    }
}
