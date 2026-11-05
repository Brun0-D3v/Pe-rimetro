package br.com.perimetro.service;

import br.com.perimetro.config.JwtProperties;
import br.com.perimetro.dto.TokenResponseDto;
import br.com.perimetro.dto.UsuarioResponseDto;
import br.com.perimetro.entity.Usuario;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class TokenService {

    private final JwtEncoder jwtEncoder;
    private final JwtProperties propriedades;

    public TokenService(JwtEncoder jwtEncoder, JwtProperties propriedades) {
        this.jwtEncoder = jwtEncoder;
        this.propriedades = propriedades;
    }

    public TokenResponseDto gerar(Usuario usuario) {
        Instant agora = Instant.now();
        Instant expiraEm = agora.plus(propriedades.expiracao());
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(usuario.getId().toString())
                .claim("perfil", usuario.getPerfil().name())
                .issuedAt(agora)
                .expiresAt(expiraEm)
                .build();
        String token = jwtEncoder.encode(
                JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
        return new TokenResponseDto(token, expiraEm, UsuarioResponseDto.de(usuario));
    }
}
