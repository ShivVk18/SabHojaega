from django.urls import path
from app.views import home_view, health_view

urlpatterns = [
    path('', home_view, name='home'),
    path('health', health_view, name='health'),
]
