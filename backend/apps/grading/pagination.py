from rest_framework.pagination import PageNumberPagination


class GradePagination(PageNumberPagination):
    """
    Pagination for grade listings.
    
    Default: 50 grades per page
    Max: 200 grades per page
    Client can override with ?page_size=N
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class LargeResultsPagination(PageNumberPagination):
    """
    Pagination for larger result sets (announcements, notifications).
    
    Default: 20 items per page
    Max: 100 items per page
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
