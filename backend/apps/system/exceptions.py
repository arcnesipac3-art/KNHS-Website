from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """
    Standardizes error responses across the API.
    Wraps all errors in a consistent { "error": { "code", "message", "details" } } envelope.
    """
    # Call REST framework's default exception handler first to get the standard error response.
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize the response data
        custom_data = {
            "error": {
                "code": exc.__class__.__name__.lower().replace("exception", ""),
                "message": response.data.get("detail", "An error occurred."),
                "details": response.data
            }
        }
        
        # If detail was in data, remove it from details to avoid redundancy
        if "detail" in custom_data["error"]["details"]:
            del custom_data["error"]["details"]["detail"]
            
        response.data = custom_data
        
        # Log 500 errors
        if response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            logger.error(f"Internal Server Error: {str(exc)}", exc_info=True)
    else:
        # For non-DRF exceptions, return a generic 500
        logger.error(f"Unhandled Exception: {str(exc)}", exc_info=True)
        response = Response(
            {
                "error": {
                    "code": "internal_server_error",
                    "message": "An unexpected error occurred on the server.",
                    "details": str(exc) if hasattr(exc, '__str__') else None
                }
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    return response
