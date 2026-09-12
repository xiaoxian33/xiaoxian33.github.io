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

    public PostAdminController(PostRepository repository) {
        this.repository = repository;
    }

    @PostMapping
    public Post create(@RequestBody PostForm form) {
        LocalDate date = form.publishedAt() != null ? form.publishedAt() : LocalDate.now();
        return repository.save(new Post(form.title(), form.body(), form.tags(), date));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Post> update(@PathVariable Long id, @RequestBody PostForm form) {
        return repository.findById(id)
                .map(post -> {
                    post.setTitle(form.title());
                    if (form.body() != null) post.setBody(form.body());
                    post.setTags(form.tags());
                    if (form.publishedAt() != null) post.setPublishedAt(form.publishedAt());
                    return ResponseEntity.ok(repository.save(post));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("ok", true, "deleted", id));
    }
}
