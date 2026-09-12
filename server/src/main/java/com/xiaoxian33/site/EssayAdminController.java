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
 * 随笔的"写"接口（增 / 改 / 删）
 * ------------------------------------------------------------
 * 🟢【核心】三个接口：
 *   POST   /api/admin/essays        新增一篇
 *   PUT    /api/admin/essays/{id}   修改某一篇
 *   DELETE /api/admin/essays/{id}   删除某一篇
 *
 * 注意网址都以 /api/admin/ 开头 → 所以**自动被门卫保护**，
 * 这个类里一行"检查身份"的代码都不用写。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/essays")
public class EssayAdminController {

    private final EssayRepository repository;

    public EssayAdminController(EssayRepository repository) {
        this.repository = repository;
    }

    /** 新增一篇：没写日期就默认今天 */
    @PostMapping
    public Essay create(@RequestBody EssayForm form) {
        LocalDate date = form.writtenOn() != null ? form.writtenOn() : LocalDate.now();
        Essay essay = new Essay(date, form.title(), form.body(), nextSortOrder());
        return repository.save(essay);      // save = INSERT（如果是新对象）
    }

    /** 修改某一篇：先按 id 找，找不到就 404 */
    @PutMapping("/{id}")
    public ResponseEntity<Essay> update(@PathVariable Long id, @RequestBody EssayForm form) {
        return repository.findById(id)
                .map(essay -> {
                    if (form.writtenOn() != null) essay.setWrittenOn(form.writtenOn());
                    essay.setTitle(form.title());
                    essay.setBody(form.body());
                    return ResponseEntity.ok(repository.save(essay));   // save = UPDATE（id 已存在）
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** 删除某一篇 */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.ok(Map.of("ok", true, "deleted", id));
    }

    /** 新的一篇排到最后 */
    private int nextSortOrder() {
        return repository.findFirstByOrderBySortOrderDesc()
                .map(e -> e.getSortOrder() + 1)
                .orElse(1);
    }
}
