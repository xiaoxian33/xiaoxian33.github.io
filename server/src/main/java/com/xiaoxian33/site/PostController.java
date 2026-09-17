package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 发帖的"读"接口（公开）
 * ------------------------------------------------------------
 * 🟢【核心】GET /api/posts → 全部帖子，新的排前面，每条带自己的图片路径数组
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

    public PostController(PostRepository repository, ImageService images) {
        this.repository = repository;
        this.images = images;
    }

    @GetMapping
    public List<PostView> list() {
        Map<Long, List<String>> imagesByPost = images.pathsByOwner(ImageService.POST);
        return repository.findAllByOrderByPublishedAtDesc()
                .stream()
                .map(post -> PostView.of(post, imagesByPost.getOrDefault(post.getId(), List.of())))
                .toList();
    }
}
