package io.causora.incident.account;

import org.springframework.security.web.csrf.CsrfToken;

public record CsrfView(String token, String headerName, String parameterName) {
    public static CsrfView from(CsrfToken token) {
        return new CsrfView(token.getToken(), token.getHeaderName(), token.getParameterName());
    }
}
