from django.http import JsonResponse

def home_view(request):
    return JsonResponse({
        "message": "Welcome to {{projectName}}!"
    })

def health_view(request):
    return JsonResponse({
        "status": "healthy"
    })
