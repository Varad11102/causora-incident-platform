package io.causora.incident.account;

import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@Service
public class AccountService implements UserDetailsService {
    private static final int BCRYPT_MAX_BYTES = 72;

    private final UserAccountRepository accounts;
    private final PasswordEncoder passwordEncoder;

    public AccountService(UserAccountRepository accounts, PasswordEncoder passwordEncoder) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public AccountView register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (accounts.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is too long after UTF-8 encoding");
        }

        UserAccount account = new UserAccount(
                UUID.randomUUID(),
                email,
                request.displayName().trim(),
                passwordEncoder.encode(request.password()),
                AccountRole.VIEWER,
                true,
                Instant.now(),
                null);
        try {
            return AccountView.from(accounts.saveAndFlush(account));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }
    }

    @Transactional(readOnly = true)
    public AccountView findView(String email) {
        return AccountView.from(findEnabled(email));
    }

    @Transactional
    public AccountView recordLogin(String email) {
        UserAccount account = findEnabled(email);
        account.recordLogin(Instant.now());
        return AccountView.from(account);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserAccount account = accounts.findByEmail(normalizeEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
        return User.withUsername(account.getEmail())
                .password(account.getPasswordHash())
                .roles(account.getRole().name())
                .disabled(!account.isEnabled())
                .build();
    }

    private UserAccount findEnabled(String email) {
        UserAccount account = accounts.findByEmail(normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        if (!account.isEnabled()) {
            throw new UsernameNotFoundException("Account not found");
        }
        return account;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
