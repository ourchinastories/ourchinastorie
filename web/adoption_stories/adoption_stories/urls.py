"""adoption_stories URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.conf.urls.i18n import i18n_patterns
from django.contrib import admin
from django.conf import settings
from django.views.i18n import javascript_catalog
from django.conf.urls.static import static

js_info_dict = {
    'packages': ('pages',),
}

urlpatterns = [
    url(r'^admin/', include(admin.site.urls), name="admin"),
    url(r'^api/v1/', include('adopteeStories.urls')),
    url(r'^jsi18n/$', javascript_catalog, js_info_dict),
]
urlpatterns += i18n_patterns(url(r'', include('pages.urls')))
urlpatterns += static(settings.MEDIA_URL,
                      document_root=settings.MEDIA_ROOT)
urlpatterns += static(settings.STATIC_URL,
                      document_root=settings.STATIC_ROOT)
