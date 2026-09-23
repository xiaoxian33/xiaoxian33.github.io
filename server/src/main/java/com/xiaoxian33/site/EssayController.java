package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 随笔接口（前端从这里取数据）
 * ------------------------------------------------------------
 * 🟢【核心】
 *   GET /api/essays        → 取出全部随笔（JSON 数组），每篇带自己的图片路径数组
 *
 * 注意这里没有写任何数据库代码 —— Controller 只管"接请求、调仓库、返回"，
 * 真正跟数据库打交道的是 EssayRepository 和 ImageService。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/essays")
public class EssayController {

    private final EssayRepository repository;
    private final ImageService images;
    private final OwnerAuthService auth;          // ← 用来判断"这次请求是不是站长本人在看" ✓

    /** 构造器注入：Spring 会自动把这三个塞进来（🔸样板） */
    public EssayController(EssayRepository repository, ImageService images, OwnerAuthService auth) {
        this.repository = repository;
        this.images = images;
        this.auth = auth;
    }

    /**
     * 全部随笔，按日期从晚到早（最新写的排最前面）
     * ------------------------------------------------------------
     * 🔒 可见性规则（这就是"只给自己看"的实现）：
     *   没带令牌（普通人 / 爬虫 / 面试官）→ 只返回 public 的 ✓
     *   带了有效令牌（站长自己）          → 连 private 的也给你 ✓（前端会显示 🔒）
     */
    @GetMapping
    public List<EssayView> list(
            @RequestHeader(value = "Authorization", required = false) String header) {

        boolean owner = auth.isValid(bearer(header));
        Map<Long, List<String>> imagesByEssay = images.pathsByOwner(ImageService.ESSAY);

        return repository.findAllByOrderByWrittenOnDesc()
                .stream()
                .filter(essay -> owner || !essay.isPrivate())      // ★ 陌生人拿不到 private ✓
                .map(essay -> EssayView.of(essay, imagesByEssay.getOrDefault(essay.getId(), List.of())))
                .toList();
    }

    /** 从请求头里取令牌："Bearer abc123" → "abc123" */
    private String bearer(String header) {
        if (header == null) return null;
        return header.startsWith("Bearer ") ? header.substring(7).trim() : null;
    }
}
