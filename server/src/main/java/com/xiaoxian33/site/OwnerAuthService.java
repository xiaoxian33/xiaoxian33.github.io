package com.xiaoxian33.site;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 站长身份服务（门卫的"大脑"）
 * ------------------------------------------------------------
 * 🟢【核心】只干三件事：
 *   1. 启动时把配置里的密码"榨"成哈希（内存里只留哈希，明文不留）
 *   2. 校验密码 → 对了就发一张令牌
 *   3. 校验令牌（在不在、过期没）
 *
 * 说明：令牌现在存在内存里，所以"重启后端就要重新登录"。
 * 以后想「记住登录 / 踢掉某台设备」，把令牌存进数据库表就行
 * —— 和你在 Cyber-Tunnel 里做的 login_token 表一个思路。
 */
@Service
public class OwnerAuthService {

    /** 令牌有效期（小时） */
    private static final int TOKEN_HOURS = 12;

    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private final String passwordHash;
    private final Map<String, LocalDateTime> tokens = new ConcurrentHashMap<>();

    public OwnerAuthService(@Value("${app.owner.password:}") String rawPassword) {
        if (rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalStateException(
                "没有配置站长密码。请在 server/src/main/resources/application-local.properties 里加一行：app.owner.password=你的密码");
        }
        this.passwordHash = encoder.encode(rawPassword);
        System.out.println("[OwnerAuth] 站长密码已加载（内存里只保存哈希，不保存明文）");
    }

    /** 密码对不对 */
    public boolean checkPassword(String input) {
        if (input == null || input.isBlank()) return false;
        return encoder.matches(input, passwordHash);
    }

    /** 发一张新令牌 */
    public String issueToken() {
        String token = UUID.randomUUID().toString().replace("-", "");
        tokens.put(token, LocalDateTime.now().plusHours(TOKEN_HOURS));
        return token;
    }

    /** 这张令牌还有效吗 */
    public boolean isValid(String token) {
        if (token == null || token.isBlank()) return false;
        LocalDateTime expiresAt = tokens.get(token);
        if (expiresAt == null) return false;
        if (expiresAt.isBefore(LocalDateTime.now())) {
            tokens.remove(token);
            return false;
        }
        return true;
    }

    /** 让令牌立刻失效（退出登录用） */
    public void revoke(String token) {
        if (token != null) tokens.remove(token);
    }

    public int tokenHours() {
        return TOKEN_HOURS;
    }
}
