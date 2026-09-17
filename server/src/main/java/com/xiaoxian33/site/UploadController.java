package com.xiaoxian33.site;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 图片上传接口
 * ------------------------------------------------------------
 * 🟢【核心】POST /api/admin/uploads   （表单字段名 file，一次一张）
 *
 * 它做的事就 4 步：
 *   ① 有没有收到东西   ② 是不是图片   ③ 大不大   ④ 存盘 + 还回路径
 *
 * 地址以 /api/admin/ 开头 → **门卫自动保护**，这里不用写一行鉴权。
 * 上传的图后面能通过 /uploads/** 读到（见 WebConfig 的静态资源映射）。
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/admin/uploads")
public class UploadController {

    /** 允许的扩展名 */
    private static final Set<String> OK_EXT = Set.of("jpg", "jpeg", "png", "webp", "gif");
    /** 允许的 Content-Type */
    private static final Set<String> OK_TYPE = Set.of("image/jpeg", "image/png", "image/webp", "image/gif");
    /** 一张图最大 5MB */
    private static final long MAX_BYTES = 5L * 1024 * 1024;

    /** 图片总目录（application.properties 里的 app.upload-dir，默认 server/uploads） */
    private final Path root;

    public UploadController(@Value("${app.upload-dir:uploads}") String uploadDir) {
        // toAbsolutePath() 很关键：转存文件时如果用相对路径，会相对"系统临时目录"去找，容易写错地方
        this.root = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        // ① 有没有东西
        if (file.isEmpty()) {
            return no("没有收到文件");
        }

        // ② 是不是图片：扩展名和 Content-Type 两个都看（只看一个都能被骗过去）
        String ext = extOf(file.getOriginalFilename());
        if (!OK_EXT.contains(ext)) {
            return no("只收 jpg / jpeg / png / webp / gif 这几种");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!OK_TYPE.contains(type)) {
            return no("这个文件看起来不是图片（" + type + "）");
        }

        // ③ 大不大
        if (file.getSize() > MAX_BYTES) {
            return no("图太大了：" + (file.getSize() / 1024) + "KB，一张最多 5MB");
        }

        // ④ 存盘：uploads/2026/09/随机名.jpg
        LocalDate today = LocalDate.now();
        String folder = "%04d/%02d".formatted(today.getYear(), today.getMonthValue());
        Path dir = root.resolve(folder);
        Files.createDirectories(dir);

        // 文件名由后端生成 —— 用户传来的名字可能带中文、空格，甚至 ../../ 想爬到别的目录，一律不用
        String name = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        file.transferTo(dir.resolve(name));

        // 数据库里存的就是这个相对路径；前端拼上后端地址就能显示（API_BASE + '/' + path）
        String path = "uploads/" + folder + "/" + name;
        return ResponseEntity.ok(Map.of("ok", true, "path", path, "size", file.getSize()));
    }

    /** 兜底：超过 Spring 自己的上传上限时，别让用户看到一个 500 错误页 */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> tooBig(MaxUploadSizeExceededException e) {
        return no("图太大了，一张最多 5MB");
    }

    private static ResponseEntity<Map<String, Object>> no(String message) {
        return ResponseEntity.badRequest().body(Map.of("ok", false, "message", message));
    }

    /** "cat.JPG" → "jpg"；没有点 → ""（那就过不了关） */
    private static String extOf(String filename) {
        if (filename == null) {
            return "";
        }
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? "" : filename.substring(dot + 1).toLowerCase();
    }
}
