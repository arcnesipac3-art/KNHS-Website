"""
Security middleware for rate limiting and protection
"""
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
import time


class RateLimitMiddleware:
    """
    Rate limiting middleware for API endpoints.
    
    Updated Limits (more generous for authenticated users):
    - Authentication endpoints: 5 requests per minute
    - Public enrollment: 10 requests per hour
    - Grade mutations (lock/unlock): 20 requests per minute
    - Grade publication: 50 requests per minute
    - General API: 1000 requests per minute (allows parallel requests from dashboards)
    """
    
    def __init__(self, get_response):
        self.get_response = get_response

    @staticmethod
    def _client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR') or 'unknown'

    @staticmethod
    def _normalized_path(request):
        path = request.path_info or request.path
        return path if path.endswith('/') else f'{path}/'

    @staticmethod
    def _rate_for_path(path, method):
        # Authentication endpoints - strict limits
        if path in {'/api/v1/auth/login/', '/api/v1/auth/register/'}:
            return 'auth', 5, 60  # 5 per minute

        # Public enrollment endpoints - moderate limits
        if path.startswith('/api/v1/enrollment-applications/'):
            is_create = method == 'POST' and path == '/api/v1/enrollment-applications/'
            is_track = path == '/api/v1/enrollment-applications/track/'
            if is_create or is_track:
                return 'public-enrollment', 10, 3600  # 10 per hour

        # Grade locking/unlocking - moderate limits
        if path.startswith('/api/v1/grades/'):
            if path.endswith('/lock/') or path.endswith('/unlock/'):
                return 'grade-locking', 20, 60  # 20 per minute
            if path.endswith('/publish/') or path.endswith('/reject/'):
                return 'grade-publication', 50, 60  # 50 per minute

        # General API endpoints - VERY generous limits for authenticated users
        if path.startswith('/api/'):
            return 'api', 1000, 60  # 1000 per minute (allows dashboard loads with many parallel requests)

        return None

    @staticmethod
    def _identity(request, scope):
        user = getattr(request, 'user', None)
        if scope != 'auth' and getattr(user, 'is_authenticated', False):
            return f'user:{user.pk}'
        return f'ip:{RateLimitMiddleware._client_ip(request)}'
        
    def __call__(self, request):
        # Skip rate limiting in DEBUG mode
        if settings.DEBUG:
            return self.get_response(request)
        
        # Skip rate limiting for authenticated superusers (check safely)
        if hasattr(request, 'user') and request.user.is_authenticated and request.user.is_superuser:
            return self.get_response(request)
        
        try:
            path = self._normalized_path(request)
            rate = self._rate_for_path(path, request.method)

            if rate is None:
                return self.get_response(request)

            scope, limit, period = rate

            # Create cache key
            identity = self._identity(request, scope)
            cache_key = f'ratelimit:{identity}:{scope}'

            # Keep the first request's TTL instead of extending the window on every hit.
            added = cache.add(cache_key, 1, period)
            if added:
                request_count = 1
            else:
                try:
                    request_count = cache.incr(cache_key)
                except ValueError:
                    cache.set(cache_key, 1, period)
                    request_count = 1

            if request_count > limit:
                return JsonResponse({
                    'error': 'Rate limit exceeded. Please try again later.',
                    'detail': f'Maximum {limit} requests per {period} seconds'
                }, status=429)

            response = self.get_response(request)

            # Add rate limit headers
            response['X-RateLimit-Limit'] = str(limit)
            response['X-RateLimit-Remaining'] = str(max(0, limit - request_count))
            response['X-RateLimit-Reset'] = str(int(time.time()) + period)

            return response
            
        except Exception as e:
            # If rate limiting fails (e.g., cache not available), allow request through
            # Log the error in production
            if not settings.DEBUG:
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Rate limiting failed: {e}")
            
            return self.get_response(request)


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
