package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 发帖的"读"接口（公开）
 * ------------------------------------------------------------
 * 🟢【核心】GET /api/posts → 帖子列表，新的排前面，每条带自己的图片路径数组
 *
 * 🔒 可见性：没带令牌的人（面试官 / 爬虫）只看得到 public 的 ✓
 *    带有效令牌（站长自己）→ private 的也返回给你 ✓
 *
 * 图片不在 post 表里，所以要问一下"记账员"（ImageService）：
 *   一次把所有图查出来，按 owner_id 分好组，再一条条贴回帖子上。
 *   （要是每条帖子都单独查一次图，10 条帖子就是 11 次查询 —— 这叫 N+1 问题）
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/posts")
public class PostController {

    private final PostRepository repository;
    private final ImageService images;
    private final OwnerAuthService auth;

    public PostController(PostRepository repository, ImageService images, OwnerAuthService auth) {
        this.repository = repository;
        this.images = images;
        this.auth = auth;
    }

    @GetMapping
    public List<PostView> list(
            @RequestHeader(value = "Authorization", required = false) String header) {

        boolean owner = auth.isValid(bearer(header));
        Map<Long, List<String>> imagesByPost = images.pathsByOwner(ImageService.POST);

        return repository.findAllByOrderByPublishedAtDesc()
                .stream()
                .filter(post -> owner || !post.isPrivate())        // ★ 陌生人拿不到 private ✓
                .map(post -> PostView.of(post, imagesByPost.getOrDefault(post.getId(), List.of())))
                .toList();
    }

    /** 从请求头里取令牌："Bearer abc123" → "abc123" */
    private String bearer(String header) {
        if (header == null) return null;
        return header.startsWith("Bearer ") ? header.substring(7).trim() : null;
    }
}
