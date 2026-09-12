package com.xiaoxian33.site;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * 排班表 📇
 * ------------------------------------------------------------
 * 🔸【样板】告诉 Spring：门卫守哪条线。
 *
 * 现在守的是 /api/admin/**  —— 以后所有"只有站长能用"的接口，
 * 只要网址以 /api/admin/ 开头，就自动被门卫保护，不用一个个加。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final OwnerAuthService auth;

    public WebConfig(OwnerAuthService auth) {
        this.auth = auth;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new OwnerAuthInterceptor(auth))
                .addPathPatterns("/api/admin/**");
    }
}
