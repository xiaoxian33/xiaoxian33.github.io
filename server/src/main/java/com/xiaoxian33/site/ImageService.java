package com.xiaoxian33.site;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 图片的"记账员"
 * ------------------------------------------------------------
 * 🟢【核心】它只干一件事：让「帖子 / 随笔」的接口不用自己操心图片记录。
 *   读：pathsByOwner()  → 一次查出所有图，按 owner_id 分好组
 *   写：replace()       → 整条替换（前端每次都是"整条提交"，所以我们也整条重写）
 *       removeAll()     → 内容被删了，它的图记录跟着走
 *
 * 🔸【样板】@Service = 这类的对象由 Spring 创建并保管；
 *   @Transactional = 这几步要么全部成功，要么全部不做（删一半留一半最麻烦）。
 */
@Service
public class ImageService {

    /** owner_type 的两个取值（写成常量，免得手打错字） */
    public static final String POST = "post";
    public static final String ESSAY = "essay";

    private final ImageRepository repository;

    public ImageService(ImageRepository repository) {
        this.repository = repository;
    }

    /**
     * 读接口专用：一次查出某种内容的全部图片，返回 "id → 路径数组"
     * 这样 8 条帖子只需要 1 次查询，而不是 8 次。
     */
    public Map<Long, List<String>> pathsByOwner(String ownerType) {
        Map<Long, List<String>> grouped = new LinkedHashMap<>();
        for (Image img : repository.findByOwnerTypeOrderBySortOrderAsc(ownerType)) {
            grouped.computeIfAbsent(img.getOwnerId(), k -> new ArrayList<>()).add(img.getPath());
        }
        return grouped;
    }

    /** 某一条内容的图片路径，按顺序 */
    public List<String> pathsOf(String ownerType, Long ownerId) {
        return repository.findByOwnerTypeAndOwnerIdOrderBySortOrderAsc(ownerType, ownerId)
                .stream()
                .map(Image::getPath)
                .toList();
    }

    /**
     * 整条替换：先把这家人的图记录全删掉，再按新顺序写一遍。
     * 前端保存时发来的是"完整的图片列表"，所以这里不需要猜哪张加过、哪张删过。
     */
    @Transactional
    public void replace(String ownerType, Long ownerId, List<String> paths) {
        repository.deleteAll(repository.findByOwnerTypeAndOwnerIdOrderBySortOrderAsc(ownerType, ownerId));
        if (paths == null || paths.isEmpty()) {
            return;
        }
        int order = 0;
        for (String path : paths) {
            if (path == null || path.isBlank()) {
                continue;                       // 空字符串直接跳过（前端列表里可能留下空位）
            }
            repository.save(new Image(ownerType, ownerId, path.trim(), order));
            order += 1;
        }
    }

    /** 内容被删掉了，它的图片记录也跟着删（磁盘上的文件先留着，以后可以写个清理脚本） */
    @Transactional
    public void removeAll(String ownerType, Long ownerId) {
        repository.deleteAll(repository.findByOwnerTypeAndOwnerIdOrderBySortOrderAsc(ownerType, ownerId));
    }
}
