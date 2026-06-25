package com.tpmp.testprep.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.path:./uploads}")
    private String uploadPath;

    /**
     * ./uploads/ 디렉토리의 파일을 /uploads/** URL로 정적 제공.
     * 이미지 업로드 후 <img src="/uploads/images/uuid.jpg"> 형태로 참조 가능.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // toUri()로 크로스플랫폼 정규 file URI 생성 (예: file:///C:/project/.../uploads/)
        // Windows에서 toString()을 쓰면 역슬래시가 섞여 Spring이 리소스를 찾지 못하는 문제 방지
        String location = Paths.get(uploadPath).toAbsolutePath().normalize().toUri().toString();
        // toUri()는 디렉터리 경로 끝 슬래시를 보장하지 않을 수 있으므로 명시적으로 보장
        if (!location.endsWith("/")) {
            location = location + "/";
        }
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(location);
    }
}
