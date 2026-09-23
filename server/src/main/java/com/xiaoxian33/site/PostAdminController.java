package com.xiaoxian33.site;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

/**
 * 发帖的"写"接口（只有站长能用）
 * ------------------------------------------------------------
 * 🟢【核心】
 *   POST   /api/admin/posts        发一条
 *   PUT    /api/admin/posts/{id}   改一条
 *   DELETE /api/admin/posts/{id}   删一条
 *
 * 又是 /api/admin/** → 门卫自动保护。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/posts")
public class PostAdminController {

    private final PostRepository repository;
    private final ImageService images;

    public PostAdminController(PostRepository repository, ImageService images) {
        this.repository = repository;
        this.images = images;
    }

    /** 发一条：先把帖子本身存进去（这时才有 id），再记下它的图片 */
    @PostMapping
    public PostView create(@RequestBody PostForm form) {
        LocalDate date = form.publishedAt() != null ? form.publishedAt() : LocalDate.now();
        Post post = new Post(form.title(), form.body(), form.tags(), date);
        if (form.visibility() != null) post.setVisibility(form.visibility());   // 🔒 新建时就能设 ✓
        Post saved = repository.save(post);

        if (form.images() != null) {
            images.replace(ImageService.POST, saved.getId(), form.images());
        }
        return PostView.of(saved, images.pathsOf(ImageService.POST, saved.getId()));
    }

    /** 改一条：正文之外，图片也是"整条提交"（不带 images = 不动图；带 [] = 清空） */
    @PutMapping("/{id}")
    public ResponseEntity<PostView> update(@PathVariable Long id, @RequestBody PostForm form) {
        return repository.findById(id)
                .map(post -> {
                    post.setTitle(form.title());
                    if (form.body() != null) post.setBody(form.body());
                    post.setTags(form.tags());
                    if (form.publishedAt() != null) post.setPublishedAt(form.publishedAt());
                    // 🔒 只切换"仅自己可见"时，前端只发 { "visibility": "private" } 就行 ✓
                    if (form.visibility() != null) post.setVisibility(form.visibility());
                    Post saved = repository.save(post);

                    if (form.images() != null) {
                        images.replace(ImageService.POST, id, form.images());
                    }
                    return ResponseEntity.ok(PostView.of(saved, images.pathsOf(ImageService.POST, id)));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** 删一条：它的图片记录也跟着走（磁盘上的图片文件先留着） */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        images.removeAll(ImageService.POST, id);
        return ResponseEntity.ok(Map.of("ok", true, "deleted", id));
    }
}
