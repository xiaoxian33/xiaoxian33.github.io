package com.xiaoxian33.site;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 登录 / 退出（把"密码"换成"令牌"）
 * ------------------------------------------------------------
 * 🟢【核心】
 *   POST /api/login        { "password": "..." }  →  对了返回 { token }
 *   POST /api/logout       带着令牌 → 让令牌作废
 *   GET  /api/admin/whoami 门卫后面的小接口，用来验证"你真的进来了"
 *
 * 为什么要有令牌？因为密码是"根钥匙"，不能每次请求都发一遍；
 * 令牌可以设有效期、可以作废。
 */
@RestController
@CrossOrigin(origins = "*")
public class AuthController {

    private final OwnerAuthService auth;

    public AuthController(OwnerAuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/api/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        if (!auth.checkPassword(body.get("password"))) {
            return ResponseEntity.status(401).body(Map.of("ok", false, "message", "密码不对"));
        }
        String token = auth.issueToken();
        return ResponseEntity.ok(Map.of("ok", true, "token", token, "hours", auth.tokenHours()));
    }

    @PostMapping("/api/logout")
    public Map<String, Object> logout(@RequestHeader(value = "Authorization", required = false) String header) {
        auth.revoke(tokenOf(header));
        return Map.of("ok", true, "message", "令牌已作废");
    }

    /** 只有带着有效令牌才能进来（门卫守在这里） */
    @GetMapping("/api/admin/whoami")
    public Map<String, Object> whoami() {
        return Map.of("ok", true, "role", "OWNER", "message", "你好，站长。门卫放你进来了。");
    }

    private String tokenOf(String header) {
        if (header == null) return null;
        return header.startsWith("Bearer ") ? header.substring(7).trim() : null;
    }
}
