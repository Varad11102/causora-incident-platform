package io.causora.incident.account;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final Policy LOGIN = new Policy(10, Duration.ofMinutes(1));
    private static final Policy REGISTER = new Policy(5, Duration.ofHours(1));
    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Map<String, Window> attempts = new ConcurrentHashMap<>();
    private final AtomicLong requestCounter = new AtomicLong();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Policy policy = policyFor(request);
        if (policy == null) {
            chain.doFilter(request, response);
            return;
        }

        long now = System.currentTimeMillis();
        String key = request.getRequestURI() + ":" + clientAddress(request);
        Decision decision = record(key, policy, now);
        if (!decision.allowed()) {
            response.setStatus(429);
            response.setHeader("Retry-After", Long.toString(decision.retryAfterSeconds()));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"error\":\"too_many_authentication_attempts\"}");
            return;
        }

        if (attempts.size() > MAX_TRACKED_CLIENTS && requestCounter.incrementAndGet() % 128 == 0) {
            attempts.entrySet().removeIf(entry -> entry.getValue().expiresAt() <= now);
        }
        chain.doFilter(request, response);
    }

    private Decision record(String key, Policy policy, long now) {
        boolean[] allowed = {true};
        long[] retryAfter = {0};
        attempts.compute(key, (ignored, current) -> {
            if (current == null || current.expiresAt() <= now) {
                return new Window(1, now + policy.window().toMillis());
            }
            if (current.count() >= policy.limit()) {
                allowed[0] = false;
                retryAfter[0] = Math.max(1, (current.expiresAt() - now + 999) / 1000);
                return current;
            }
            return new Window(current.count() + 1, current.expiresAt());
        });
        return new Decision(allowed[0], retryAfter[0]);
    }

    private Policy policyFor(HttpServletRequest request) {
        if (!"POST".equals(request.getMethod())) return null;
        return switch (request.getRequestURI()) {
            case "/api/v1/auth/login" -> LOGIN;
            case "/api/v1/auth/register" -> REGISTER;
            default -> null;
        };
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        String address = forwarded == null ? request.getRemoteAddr() : forwarded.split(",", 2)[0].trim();
        return address.length() <= 128 ? address : address.substring(0, 128);
    }

    private record Policy(int limit, Duration window) {}
    private record Window(int count, long expiresAt) {}
    private record Decision(boolean allowed, long retryAfterSeconds) {}
}
