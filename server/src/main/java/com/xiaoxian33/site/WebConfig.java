package com.xiaoxian33.site;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 排班表 📇
 * ------------------------------------------------------------
 * 🔸【样板】告诉 Spring 两件事：
 *   ① 门卫守哪条线（addInterceptors）
 *   ② 硬盘上哪个目录可以直接用网址访问（addResourceHandlers）
 *
 * 门卫守的是 /api/admin/** —— 以后所有"只有站长能用"的接口，
 * 只要网址以 /api/admin/ 开头，就自动被门卫保护，不用一个个加。
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final OwnerAuthService auth;
    private final String uploadDir;

    public WebConfig(OwnerAuthService auth, @Value("${app.upload-dir:uploads}") String uploadDir) {
        this.auth = auth;
        this.uploadDir = uploadDir;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new OwnerAuthInterceptor(auth))
                .addPathPatterns("/api/admin/**");
    }

    /**
     * 把硬盘上的 uploads 目录"挂"到网址 /uploads/** 上。
     * 上传成功后，图片就能这样访问（前端拼上 API_BASE 就能显示）：
     *   http://localhost:8080/uploads/2026/09/abc.jpg
     *
     * 注意：这里没有被门卫拦住 —— /uploads/** 不在 /api/admin/** 里，
     * 所以访客也能看到图片（本来就该这样）。
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 用 toUri() 而不是自己拼 "file:" + 路径：
        // 我们的项目路径里有空格（D:\Java works\...），空格在网址里必须写成 %20
        String location = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
