package br.com.perimetro.config;

import br.com.perimetro.dto.ErroResponseDto;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
@EnableConfigurationProperties(JwtProperties.class)
public class SegurancaConfig {

    private static final String ROTAS_API = "/api/v1/**";

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecretKey chaveJwt(JwtProperties propriedades) {
        return new SecretKeySpec(propriedades.segredo().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
    }

    @Bean
    public JwtEncoder jwtEncoder(SecretKey chaveJwt) {
        return new NimbusJwtEncoder(new ImmutableSecret<>(chaveJwt));
    }

    @Bean
    public JwtDecoder jwtDecoder(SecretKey chaveJwt) {
        return NimbusJwtDecoder.withSecretKey(chaveJwt).macAlgorithm(MacAlgorithm.HS256).build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter conversor = new JwtAuthenticationConverter();
        conversor.setJwtGrantedAuthoritiesConverter(jwt ->
                List.of(new SimpleGrantedAuthority("ROLE_" + jwt.getClaimAsString("perfil"))));
        return conversor;
    }

    @Bean
    public AuthenticationEntryPoint naoAutenticadoHandler(ObjectMapper objectMapper) {
        return (requisicao, resposta, excecao) ->
                escreverErro(objectMapper, resposta, HttpServletResponse.SC_UNAUTHORIZED,
                        "Autenticação necessária ou sessão expirada");
    }

    @Bean
    public AccessDeniedHandler semPermissaoHandler(ObjectMapper objectMapper) {
        return (requisicao, resposta, excecao) ->
                escreverErro(objectMapper, resposta, HttpServletResponse.SC_FORBIDDEN,
                        "Você não tem permissão para esta operação");
    }

    @Bean
    public SecurityFilterChain filtrosDeSeguranca(HttpSecurity http,
                                                  JwtAuthenticationConverter conversor,
                                                  AuthenticationEntryPoint naoAutenticadoHandler,
                                                  AccessDeniedHandler semPermissaoHandler) {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(sessao -> sessao.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(regras -> regras
                        .requestMatchers(HttpMethod.OPTIONS, ROTAS_API).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/usuarios/**").authenticated()
                        .requestMatchers(HttpMethod.GET, ROTAS_API).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/trechos", "/api/v1/trechos/*/avaliacoes").authenticated()
                        .requestMatchers("/api/v1/trechos/**", "/api/v1/regioes/**").hasRole("ADMINISTRADOR")
                        .anyRequest().authenticated())
                .oauth2ResourceServer(servidor -> servidor
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(conversor))
                        .authenticationEntryPoint(naoAutenticadoHandler)
                        .accessDeniedHandler(semPermissaoHandler))
                .exceptionHandling(erros -> erros
                        .authenticationEntryPoint(naoAutenticadoHandler)
                        .accessDeniedHandler(semPermissaoHandler));
        return http.build();
    }

    private void escreverErro(ObjectMapper objectMapper, HttpServletResponse resposta, int status, String mensagem)
            throws IOException {
        resposta.setStatus(status);
        resposta.setContentType(MediaType.APPLICATION_JSON_VALUE);
        resposta.setCharacterEncoding(StandardCharsets.UTF_8.name());
        objectMapper.writeValue(resposta.getOutputStream(), new ErroResponseDto(mensagem, LocalDateTime.now()));
    }
}
