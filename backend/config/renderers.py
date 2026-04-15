from rest_framework.renderers import JSONRenderer

class ApiResponseRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context["response"]

        if isinstance(data, dict) and "success" in data:
            return super().render(data, accepted_media_type, renderer_context)

        success = 200 <= response.status_code < 300

        formatted = {
            "success": success,
            "message": "Success" if success else "Error",
            "data": data if success else None,
            "errors": data if not success else None,
        }

        return super().render(formatted, accepted_media_type, renderer_context)