package io.causora.incident.account;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AccountServiceTest {
    private final UserAccountRepository repository = mock(UserAccountRepository.class);
    private final PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
    private final AccountService service = new AccountService(repository, passwordEncoder);

    @Test
    void registersANormalizedViewerWithoutPersistingTheRawPassword() {
        when(passwordEncoder.encode("a-secure-password")).thenReturn("bcrypt-hash");
        when(repository.saveAndFlush(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccountView result = service.register(new RegisterRequest(
                "  VARAD@Example.COM ", "  Varad Operator  ", "a-secure-password"));

        assertThat(result.email()).isEqualTo("varad@example.com");
        assertThat(result.displayName()).isEqualTo("Varad Operator");
        assertThat(result.role()).isEqualTo(AccountRole.VIEWER);
        verify(passwordEncoder).encode("a-secure-password");
        verify(repository).saveAndFlush(any(UserAccount.class));
    }

    @Test
    void rejectsAnExistingEmailBeforeHashing() {
        when(repository.existsByEmail("varad@example.com")).thenReturn(true);

        assertThatThrownBy(() -> service.register(new RegisterRequest(
                "VARAD@example.com", "Varad", "a-secure-password")))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void rejectsPasswordsThatExceedTheBcryptByteLimit() {
        String multibytePassword = "€".repeat(25);

        assertThatThrownBy(() -> service.register(new RegisterRequest(
                "varad@example.com", "Varad", multibytePassword)))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(exception -> assertThat(((ResponseStatusException) exception).getStatusCode())
                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void loadsRolesAndDisabledStateForSpringSecurity() {
        UserAccount account = new UserAccount(UUID.randomUUID(), "operator@example.com", "Operator", "hash",
                AccountRole.OPERATOR, false, Instant.now(), null);
        when(repository.findByEmail("operator@example.com")).thenReturn(Optional.of(account));

        UserDetails result = service.loadUserByUsername("OPERATOR@example.com");

        assertThat(result.getUsername()).isEqualTo("operator@example.com");
        assertThat(result.isEnabled()).isFalse();
        assertThat(result.getAuthorities()).extracting(Object::toString).containsExactly("ROLE_OPERATOR");
    }
}
