from django.db import models
from django import forms
from django.utils.translation import ugettext_lazy as _

from .backends import detect_backend, UnknownIdException, \
    UnknownBackendException, YoutubeBackend, SoundCloudBackend

__all__ = ('EmbedVideoField', 'EmbedVideoFormField')


class EmbedVideoField(models.URLField):
    """
    Model field for embeded video. Descendant of
    :py:class:`django.db.models.URLField`.
    """

    def formfield(self, **kwargs):
        defaults = {'form_class': EmbedVideoFormField}
        defaults.update(kwargs)
        return super(EmbedVideoField, self).formfield(**defaults)

    def south_field_triple(self):
        from south.modelsinspector import introspector
        cls_name = '%s.%s' % (
            self.__class__.__module__,
            self.__class__.__name__
        )
        args, kwargs = introspector(self)
        return (cls_name, args, kwargs)


# TODO: Clean this up with some proper inheritance
class EmbedBackendField(models.URLField):
    def formfield(self, **kwargs):
        defaults = {'form_class': self.backend_field_class}
        defaults.update(kwargs)
        return super(EmbedBackendField, self).formfield(**defaults)

    def south_field_triple(self):
        from south.modelsinspector import introspector
        cls_name = '%s.%s' % (
            self.__class__.__module__,
            self.__class__.__name__
        )
        args, kwargs = introspector(self)
        return (cls_name, args, kwargs)


class EmbedVideoFormField(forms.URLField):
    """
    Form field for embeded video. Descendant of
    :py:class:`django.forms.URLField`
    """

    def validate(self, url):
        # if empty url is not allowed throws an exception
        super(EmbedVideoFormField, self).validate(url)

        if not url:
            return

        try:
            backend = detect_backend(url)
            backend.get_code()
        except UnknownBackendException:
            raise forms.ValidationError(_(u'URL could not be recognized.'))
        except UnknownIdException:
            raise forms.ValidationError(_(u'ID of this video could not be '
                                          u'recognized.'))
        return url


class EmbedBackendFormField(forms.URLField):
    """
    Form field for embedded video from a specific backend. Descendant of
    :py:class:`django.forms.URLField`
    """

    def validate(self, url):
        # if empty url is not allowed throws an exception
        super(EmbedBackendFormField, self).validate(url)

        if not url:
            return

        try:
            if not self.backend_class.is_valid(url):
                raise forms.ValidationError(_(u'URL could not be recognized.'))
            backend = self.backend_class(url)
            backend.get_code()
        except UnknownIdException:
            raise forms.ValidationError(_(u'ID of this video could not be '
                                          u'recognized.'))
        return url


class EmbedYoutubeFormField(EmbedBackendFormField):
    backend_class = YoutubeBackend


class EmbedSoundcloudFormField(EmbedBackendFormField):
    backend_class = SoundCloudBackend


class EmbedYoutubeField(EmbedBackendField):
    backend_field_class = EmbedYoutubeFormField


class EmbedSoundcloudField(EmbedBackendField):
    backend_field_class = EmbedSoundcloudFormField
