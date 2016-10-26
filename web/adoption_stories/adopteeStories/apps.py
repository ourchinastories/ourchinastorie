# in yourapp/apps.py
from django.apps import AppConfig
from django.utils.translation import ugettext_lazy as _


class AdopteeStoriesConfig(AppConfig):
    name = 'adopteeStories'
    # Translators: Title of the admin page
    verbose_name = _('Adoptee Stories')
