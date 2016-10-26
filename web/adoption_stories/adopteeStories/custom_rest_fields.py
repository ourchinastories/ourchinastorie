from embed_video.backends import SoundCloudBackend, VideoDoesntExistException, YoutubeBackend
from rest_framework.exceptions import ValidationError
from rest_framework.fields import URLField
from django.utils.translation import ugettext_lazy as _


class ValidateIsService(object):
    def __init__(self, backend_class):
        self.backend_class = backend_class

    def __call__(self, url):
        if self.backend_class.is_valid(url):
            backend = self.backend_class(url)
            try:
                backend.get_code()
            except VideoDoesntExistException:
                raise ValidationError(_('A multimedia item matching the '
                                        'url could not be found. Does one '
                                        'exist?'))

        else:
            raise ValidationError(_('Provided url is invalid'))


class SoundcloudField(URLField):
    def __init__(self, **kwargs):
        super(SoundcloudField, self).__init__(**kwargs)
        validator = ValidateIsService(SoundCloudBackend)
        self.validators.append(validator)


class YoutubeField(URLField):
    def __init__(self, **kwargs):
        super(URLField, self).__init__(**kwargs)
        validator = ValidateIsService(YoutubeBackend)
        self.validators.append(validator)
