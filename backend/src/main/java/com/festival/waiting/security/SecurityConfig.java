package com.festival.waiting.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 공개 API 경로 및 리소스
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/config/kakao-key").permitAll()
                .requestMatchers("/api/festivals", "/api/festivals/recommend").permitAll()
                .requestMatchers("/api/festivals/*/booths").permitAll()
                .requestMatchers("/api/booths/*").permitAll()
                .requestMatchers("/api/booths/*/waitings").permitAll()
                .requestMatchers("/api/waitings/*/status", "/api/waitings/*/cancel").permitAll()
                .requestMatchers("/api/spots/congestion").permitAll()
                .requestMatchers("/api/ai/**").permitAll()
                
                // 정적 리소스 및 Swagger UI
                .requestMatchers("/", "/index.html", "/booth.html", "/uploads/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                
                // 세부 역할별 권한 매핑
                .requestMatchers(HttpMethod.POST, "/api/booths").hasRole("MERCHANT")
                .requestMatchers(HttpMethod.PUT, "/api/booths/*").hasRole("MERCHANT")
                .requestMatchers(HttpMethod.POST, "/api/booths/*/waitings").hasRole("CUSTOMER")
                .requestMatchers("/api/booths/*/waitings/call-next").hasRole("MERCHANT")
                .requestMatchers("/api/waitings/*/complete").hasRole("MERCHANT")
                .requestMatchers("/api/waitings/*/cancel").authenticated() // 고객, 상인 공통 취소
                .requestMatchers("/api/config/solapi").hasRole("ADMIN")
                
                // H2 콘솔 및 일반 보안 통제 경로
                .requestMatchers("/h2-console/**").hasRole("ADMIN")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/organizer/**").hasRole("ORGANIZER")
                .requestMatchers("/api/merchant/**").hasRole("MERCHANT")
                .requestMatchers("/api/waitings/**").hasRole("CUSTOMER")
                
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
            .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public org.springframework.web.cors.CorsConfigurationSource corsConfigurationSource() {
        org.springframework.web.cors.CorsConfiguration configuration = new org.springframework.web.cors.CorsConfiguration();
        configuration.setAllowedOriginPatterns(java.util.List.of("*"));
        configuration.setAllowedMethods(java.util.List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(java.util.List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        org.springframework.web.cors.UrlBasedCorsConfigurationSource source = new org.springframework.web.cors.UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

