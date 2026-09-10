package com.xiaoxian33.site;

import org.springframework.web.bind.annotation.CrossOrigin;
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
 * @CrossOrigin     = 「通行证」：允许别的网址来访问我。
 *   为什么需要它？你的网页在 xiaoxian33.github.io，后端在 localhost:8080 ——
 *   两个不同的门牌号。浏览器出于安全，默认会拦住这种"跨站请求"（这就是 CORS）。
 *   现在写 "*" 表示谁都允许（方便学习）；等接了登录，要改成只允许你自己的网站。
 */
@RestController
@CrossOrigin(origins = "*")
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
