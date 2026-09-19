package com.basketballgm.config;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.web.SecurityFilterChain;

/** Stateless JWT security for both the local flow and future cloud deployment. */
@Configuration
@EnableWebSecurity
public class SecurityConfig {
  private final String jwtSecret;

  public SecurityConfig(@Value("${app.auth.jwt-secret}") String jwtSecret) {
    if (jwtSecret.length() < 32) {
      throw new IllegalStateException("JWT_SECRET 必须至少包含 32 个字符。");
    }
    this.jwtSecret = jwtSecret;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(authorize -> authorize
            // Only credential submission is public. Keeping /auth/me protected prevents
            // an accidental future auth endpoint from becoming anonymous by wildcard.
            .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login")
            .permitAll()
            .requestMatchers(HttpMethod.GET, "/api/v1/health").permitAll()
            // Community reads stay anonymous; writes below still require a JWT.
            .requestMatchers(HttpMethod.GET, "/api/v1/forum/posts", "/api/v1/forum/posts/**").permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .anyRequest().authenticated())
        .exceptionHandling(exceptions -> exceptions.authenticationEntryPoint((request, response, error) -> {
          response.setStatus(401);
          response.setContentType("application/json;charset=UTF-8");
          response.getWriter().write("{\"message\":\"请先登录或重新登录。\"}");
        }))
        .oauth2ResourceServer(resourceServer -> resourceServer.jwt(Customizer.withDefaults()))
        .build();
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public JwtEncoder jwtEncoder() {
    return new NimbusJwtEncoder(new ImmutableSecret<>(signingKey()));
  }

  @Bean
  public JwtDecoder jwtDecoder() {
    return NimbusJwtDecoder.withSecretKey(signingKey()).macAlgorithm(MacAlgorithm.HS256).build();
  }

  private SecretKey signingKey() {
    return new SecretKeySpec(jwtSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
  }
}
