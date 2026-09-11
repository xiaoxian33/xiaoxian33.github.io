package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 随笔接口（前端将来从这里取数据）
 * ------------------------------------------------------------
 * 🟢【核心】
 *   GET /api/essays        → 取出全部随笔（JSON 数组）
 *
 * 注意这里没有写任何数据库代码 —— Controller 只管"接请求、调仓库、返回"，
 * 真正跟数据库打交道的是 EssayRepository。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/essays")
public class EssayController {

    private final EssayRepository repository;

    /** 构造器注入：Spring 会自动把 repository 塞进来（🔸样板） */
    public EssayController(EssayRepository repository) {
        this.repository = repository;
    }

    /** 全部随笔，按日期从早到晚 */
    @GetMapping
    public List<Essay> list() {
        return repository.findAllByOrderByWrittenOnAsc();
    }
}
