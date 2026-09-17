package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
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

    /** 构造器注入：Spring 会自动把这两个塞进来（🔸样板） */
    public EssayController(EssayRepository repository, ImageService images) {
        this.repository = repository;
        this.images = images;
    }

    /** 全部随笔，按日期从早到晚 */
    @GetMapping
    public List<EssayView> list() {
        Map<Long, List<String>> imagesByEssay = images.pathsByOwner(ImageService.ESSAY);
        return repository.findAllByOrderByWrittenOnAsc()
                .stream()
                .map(essay -> EssayView.of(essay, imagesByEssay.getOrDefault(essay.getId(), List.of())))
                .toList();
    }
}
