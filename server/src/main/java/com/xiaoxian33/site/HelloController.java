package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 我们的第一个后端接口。
 * ------------------------------------------------------------
 * @RestController  = 我是一个"接单窗口"（把返回的内容直接写给浏览器）
 * @GetMapping(...) = 当有人用 GET 访问这个地址时，执行下面的方法
 *
 * 浏览器打开 http://localhost:8080/api/hello 就能看到结果。
 * Spring 会把这个 Map 自动变成 JSON 文本，比如：
 *   {"message":"你好，这里是张书贤的后端","time":"2026-09-10T15:00:00"}
 */
@RestController
public class HelloController {

    /** 打开根地址时，给一句人话，免得看到默认的报错页 */
    @GetMapping("/")
    public String home() {
        return "后端已启动 ✅  试试访问 /api/hello";
    }

    /** 第一个真正的接口：返回一小段 JSON */
    @GetMapping("/api/hello")
    public Map<String, Object> hello() {
        Map<String, Object> data = new HashMap<>();
        data.put("message", "你好，这里是张书贤的后端");
        data.put("time", LocalDateTime.now().toString());
        data.put("status", "ok");
        return data;
    }
}
