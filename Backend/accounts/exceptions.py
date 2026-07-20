from rest_framework.views import exception_handler
from rest_framework.exceptions import ValidationError

def custom_exception_handler(exc, context):
    """
    Custom exception handler to format Django REST Framework exceptions
    consistently into the requested structure:
    {
        "success": false,
        "message": "Validation failed",
        "data": {},
        "errors": { ... }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        errors = {}
        message = "An error occurred"

        if isinstance(exc, ValidationError):
            message = "Validation failed"
            errors = response.data
        else:
            if isinstance(response.data, dict):
                if 'detail' in response.data:
                    message = response.data['detail']
                errors = response.data
            elif isinstance(response.data, list):
                errors = {"non_field_errors": response.data}
            else:
                errors = {"detail": str(response.data)}

        response.data = {
            "success": False,
            "message": message,
            "data": {},
            "errors": errors
        }
    return response
