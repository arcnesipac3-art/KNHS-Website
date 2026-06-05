import json

import pytest
from django.core.cache import cache
from django.http import HttpResponse
from django.test import RequestFactory, override_settings
from rest_framework import status
from rest_framework.test import APIClient

from apps.accounts.models import User
from config.middleware import RateLimitMiddleware


TEST_CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'auth-rate-limit-tests',
    }
}


@pytest.fixture(autouse=True)
def use_test_cache(settings):
    settings.CACHES = TEST_CACHES
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_login_rejects_invalid_credentials_without_server_error():
    client = APIClient(REMOTE_ADDR='203.0.113.10')

    response = client.post(
        '/api/v1/auth/login/',
        {'email': 'missing@example.com', 'password': 'wrong-password'},
        format='json',
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert response.data['error']['code'] == 'invalid_credentials'


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_login_succeeds_before_rate_limit_is_exceeded():
    User.objects.create_user(
        email='admin@example.com',
        password='StrongPass123!',
        role=User.Role.ADMIN,
        is_active=True,
        is_approved=True,
    )
    client = APIClient(REMOTE_ADDR='203.0.113.11')

    response = client.post(
        '/api/v1/auth/login/',
        {'email': 'admin@example.com', 'password': 'StrongPass123!'},
        format='json',
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data['access_token']
    assert response.data['user']['email'] == 'admin@example.com'


@pytest.mark.django_db
@override_settings(DEBUG=True)
def test_login_scoped_throttle_returns_429_after_five_attempts():
    client = APIClient(REMOTE_ADDR='203.0.113.12')

    for _ in range(5):
        response = client.post(
            '/api/v1/auth/login/',
            {'email': 'missing@example.com', 'password': 'wrong-password'},
            format='json',
        )
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    response = client.post(
        '/api/v1/auth/login/',
        {'email': 'missing@example.com', 'password': 'wrong-password'},
        format='json',
    )

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert response.data['error']['code'] == 'throttled'


@override_settings(DEBUG=False)
def test_rate_limit_middleware_limits_auth_scope():
    factory = RequestFactory(REMOTE_ADDR='198.51.100.10')
    middleware = RateLimitMiddleware(lambda request: HttpResponse('ok'))

    for _ in range(5):
        response = middleware(factory.post('/api/v1/auth/login/'))
        assert response.status_code == status.HTTP_200_OK
        assert response['X-RateLimit-Limit'] == '5'

    response = middleware(factory.post('/api/v1/auth/login/'))

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert json.loads(response.content)['error'] == 'Rate limit exceeded. Please try again later.'


@override_settings(DEBUG=False)
def test_rate_limit_middleware_groups_detail_grade_unlock_routes():
    factory = RequestFactory(REMOTE_ADDR='198.51.100.11')
    middleware = RateLimitMiddleware(lambda request: HttpResponse('ok'))

    for index in range(10):
        response = middleware(factory.post(f'/api/v1/grades/{index}/unlock/'))
        assert response.status_code == status.HTTP_200_OK
        assert response['X-RateLimit-Limit'] == '10'

    response = middleware(factory.post('/api/v1/grades/10/unlock/'))

    assert response.status_code == status.HTTP_429_TOO_MANY_REQUESTS
