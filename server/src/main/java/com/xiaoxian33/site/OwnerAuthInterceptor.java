package com.xiaoxian33.site;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 门卫本人 🚪
 * ------------------------------------------------------------
 * 🟢【核心】每个 /api/admin/** 的请求，先经过这里：
 *   ① 从请求头里取令牌：Authorization: Bearer xxxxx
 *   ② 让 OwnerAuthService 检查令牌
 *      有效   → return true  放行
 *      无效   → 401 直接挡回去，业务代码一行都不会执行，数据库更碰不到
 *
 * 注意：门卫只管"你有没有令牌"，不管业务。所以以后加多少写接口，它都不用改。
 */
public class OwnerAuthInterceptor implements HandlerInterceptor {

    private final OwnerAuthService auth;

    public OwnerAuthInterceptor(OwnerAuthService auth) {
        this.auth = auth;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws Exception {

        // 浏览器的跨域"预检请求"（OPTIONS）先放行，让它自己去问后端允许不允许
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String header = request.getHeader("Authorization");
        String token = (header != null && header.startsWith("Bearer ")) ? header.substring(7).trim() : null;

        if (auth.isValid(token)) {
            return true;   // 有令牌 → 放行
        }

        response.setStatus(401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"ok\":false,\"message\":\"需要站长令牌\"}");
        return false;      // 没令牌 → 挡在门外
    }
}
