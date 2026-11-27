package io.github.infinityinside.roombooking.auth;

import io.github.infinityinside.roombooking.api.AuthApi;
import io.github.infinityinside.roombooking.api.model.AuthResponseDto;
import io.github.infinityinside.roombooking.api.model.CurrentUserDto;
import io.github.infinityinside.roombooking.api.model.LoginRequestDto;
import io.github.infinityinside.roombooking.api.model.RegisterRequestDto;
import io.github.infinityinside.roombooking.auth.AuthService.AuthResult;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RestController;

@RestController
class AuthController implements AuthApi {

    private final AuthService auth;

    AuthController(AuthService auth) {
        this.auth = auth;
    }

    @Override
    public ResponseEntity<AuthResponseDto> register(RegisterRequestDto request) {
        AuthResult result = auth.register(
                request.getFirstName(), request.getLastName(), request.getEmail(), request.getPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(result));
    }

    @Override
    public ResponseEntity<AuthResponseDto> login(LoginRequestDto request) {
        return ResponseEntity.ok(toResponse(auth.login(request.getEmail(), request.getPassword())));
    }

    @Override
    public ResponseEntity<CurrentUserDto> getCurrentUser() {
        return ResponseEntity.ok(CurrentUserMapper.toDto(auth.currentUser()));
    }

    private static AuthResponseDto toResponse(AuthResult result) {
        return new AuthResponseDto()
                .accessToken(result.token().value())
                .tokenType(AuthResponseDto.TokenTypeEnum.BEARER)
                .expiresIn(Math.toIntExact(result.token().expiresInSeconds()))
                .user(CurrentUserMapper.toDto(result.user()));
    }
}