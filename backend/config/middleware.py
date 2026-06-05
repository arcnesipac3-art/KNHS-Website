"""
Security middleware for rate limiting and protection
"""
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
import time


class RateLimitMiddleware:
    """
    Rate limiting middleware for API endpoints.
    
    Limits:
    - Authentication endpoints: 5 requests per minute
    - Grade mutations (lock/unlock): 10 requests per minute
    - General API: 100 requests per minute
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Skip rate limiting in DEBUG mode or for superusers
        if settings.DEBUG or (hasattr(request, 'user') and request.user.is_superuser):
            return self.get_response(request)
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        path = request.path
        
        # Determine rate limit based on endpoint
        if '/auth/login/' in path or '/auth/register/' in path:
            limit, period = 5, 60  # 5 per minute
        elif '/grades/lock/' in path or '/grades/unlock/' in path:
            limit, period = 10, 60  # 10 per minute
        elif '/grades/publish/' in path or '/grades/reject/' in path:
            limit, period = 20, 60  # 20 per minute
        elif path.startswith('/api/'):
            limit, period = 100, 60  # 100 per minute for general API
        else:
            return self.get_response(request)
        
        # Create cache key
        cache_key = f'ratelimit:{ip}:{path}'
        
        # Get current request count
        request_count = cache.get(cache_key, 0)
        
        if request_count >= limit:
            return JsonResponse({
                'error': 'Rate limit exceeded. Please try again later.',
                'detail': f'Maximum {limit} requests per {period} seconds'
            }, status=429)
        
        # Increment counter
        cache.set(cache_key, request_count + 1, period)
        
        response = self.get_response(request)
        
        # Add rate limit headers
        response['X-RateLimit-Limit'] = str(limit)
        response['X-RateLimit-Remaining'] = str(max(0, limit - request_count - 1))
        response['X-RateLimit-Reset'] = str(int(time.time()) + period)
        
        return response


class SecurityHeadersMiddleware:
    """
    Add security headers to responses
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        # Content Security Policy (adjust for your needs)
        if not settings.DEBUG:
            response['Content-Security-Policy'] = (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "font-src 'self' data:; "
                "connect-src 'self' https://api.yourfrontend.com"
            )
        
        return response
