package io.causora.incident.account;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerTest {
    private final AccountService accounts = mock(AccountService.class);
    private final AuthenticationManager authenticationManager = mock(AuthenticationManager.class);
    private final SecurityContextRepository contextRepository = mock(SecurityContextRepository.class);
    private final SessionAuthenticationStrategy sessionStrategy = mock(SessionAuthenticationStrategy.class);
    private final AuthController controller = new AuthController(
            accounts, authenticationManager, contextRepository, sessionStrategy);

    @AfterEach
    void clearSecurityContext() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    void createsAndPersistsAServerSideSecurityContextOnLogin() {
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        Authentication authenticated = UsernamePasswordAuthenticationToken.authenticated(
                "viewer@example.com", "hidden", java.util.List.of());
        AccountView account = new AccountView(UUID.randomUUID(), "viewer@example.com", "Viewer",
                AccountRole.VIEWER, Instant.now(), Instant.now());
        when(authenticationManager.authenticate(any(Authentication.class))).thenReturn(authenticated);
        when(accounts.recordLogin("viewer@example.com")).thenReturn(account);

        AccountView result = controller.login(new LoginRequest("viewer@example.com", "a-secure-password"),
                request, response);

        assertThat(result).isSameAs(account);
        verify(sessionStrategy).onAuthentication(authenticated, request, response);
        verify(contextRepository).saveContext(any(), any(), any());
    }

    @Test
    void returnsOnlyAGenericUnauthorizedFailureForBadCredentials() {
        when(authenticationManager.authenticate(any(Authentication.class)))
                .thenThrow(new BadCredentialsException("internal detail"));

        assertThatThrownBy(() -> controller.login(new LoginRequest("viewer@example.com", "wrong-password"),
                mock(HttpServletRequest.class), mock(HttpServletResponse.class)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> {
                    ResponseStatusException response = (ResponseStatusException) exception;
                    assertThat(response.getStatusCode().value()).isEqualTo(401);
                    assertThat(response.getReason()).isEqualTo("Invalid email or password");
                });
    }
}
