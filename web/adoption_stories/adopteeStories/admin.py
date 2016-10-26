from django.contrib import admin

# Register your models here.
from adopteeStories import models
from django.db.models import Q
from django.forms.models import ModelForm
from django.forms.utils import ErrorList
from embed_video.admin import AdminVideoMixin
from django.conf import settings
from django.conf.urls.static import static

admin.site.register(models.Photo)
admin.site.register(models.AboutPerson)


class LimitChoicesBaseForm(ModelForm):
    limit_choices_methods = []

    def __init__(self, data=None, files=None, auto_id='id_%s', prefix=None,
                 initial=None, error_class=ErrorList, label_suffix=None,
                 empty_permitted=False, instance=None):
        super(LimitChoicesBaseForm, self).__init__(data=data, files=files, auto_id=auto_id, prefix=prefix,
                                                   initial=initial, error_class=error_class, label_suffix=label_suffix,
                                                   empty_permitted=empty_permitted, instance=instance)
        for method in self.limit_choices_methods:
            formfield = self.fields[method['field_name']]
            if hasattr(formfield, 'queryset'):
                filter_q_object = method['method'](instance)
                formfield.queryset = formfield.queryset.filter(filter_q_object)


class LimitChoicesAdopteeForm(LimitChoicesBaseForm):
    limit_choices_methods = [{'field_name': 'front_story',
                              'method': lambda instance: Q(related_adoptee=instance)}]


@admin.register(models.Adoptee)
class AdopteeAdmin(admin.ModelAdmin):
    search_fields = ['english_name']
    form = LimitChoicesAdopteeForm
    class Media:
        js = (
            settings.STATIC_URL +'pages/sorttable.js',
        )
        css = {
            'screen': (settings.STATIC_URL +'pages/admin.css',)
        }
        

@admin.register(models.RelationshipCategory)
class RelationshipCategoryAdmin(admin.ModelAdmin):
    search_fields = ['english_name']
    class Media:
        js = (
            settings.STATIC_URL +'pages/sorttable.js',
        )
        css = {
            'screen': (settings.STATIC_URL +'pages/admin.css',)
        }

@admin.register(models.StoryTeller)
class StoryTellerAdmin(admin.ModelAdmin):
    search_fields = ['english_name']
    class Media:
        js = (
            settings.STATIC_URL +'pages/sorttable.js',
        )
        css = {
            'screen': (settings.STATIC_URL +'pages/admin.css',)
        }

@admin.register(models.Audio)
class AudioModelAdmin(AdminVideoMixin, admin.ModelAdmin):
    pass


@admin.register(models.Video)
class VideoModelAdmin(AdminVideoMixin, admin.ModelAdmin):
    pass
