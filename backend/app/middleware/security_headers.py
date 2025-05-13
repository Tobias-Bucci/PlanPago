# backend/app/middleware/security_headers.py
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Receive, Scope, Send
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        # Content-Security-Policy: Prevent XSS
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';"
        )
        # Strict-Transport-Security: Enforce HTTPS
        response.headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload'
        # Permissions-Policy: Disable camera, microphone, geolocation
        response.headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()'
        # Optional: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        return response
