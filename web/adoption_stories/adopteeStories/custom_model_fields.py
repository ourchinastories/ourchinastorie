from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import ugettext_noop

from .translation_utils import string_format_lazy

# hacky solution to compilation problem
# Translators: the words in brackets are replaced by something else. For the code to work properly you should leave the brackets and the words inside of them as-is. You can move them around (i.e. copy-paste in different places)
ugettext_noop('Photo has incorrect dimensions. It should be of '
              'width {photo_width} and height {photo_height}.')
# Translators: the words in brackets are replaced by something else. For the code to work properly you should leave the brackets and the words inside of them as-is. You can move them around (i.e. copy-paste in different places)
ugettext_noop('Photo does not have the required format. '
              'It should be one of the following formats: {formats_list}.')
# Translators: the words in brackets are replaced by something else. For the code to work properly you should leave the brackets and the words inside of them as-is. You can move them around (i.e. copy-paste in different places)
ugettext_noop('The file size of the photo is too large. '
              'It should be of size {max_kilobytes} KB or less')


class ImageValidator:
    def __init__(self, maximum_size, required_width, required_height, required_formats):
        self.maximum_size = maximum_size
        self.required_width = required_width
        self.required_height = required_height
        self.required_formats = required_formats

    def __call__(self, image_file):
        if hasattr(image_file.file, 'image'):
            image = image_file.file.image
            if image_file.size > self.maximum_size:
                # Translators: the words in brackets are replaced by something else. For the code to work properly you should leave the brackets and the words inside of them as-is. You can move them around (i.e. copy-paste in different places)
                raise ValidationError(
                    string_format_lazy('The file size of the photo is too large. '
                                       'It should be of size {max_kilobytes} KB or less',
                                       max_kilobytes=int(self.maximum_size / 2 ** 10))
                )



            if image.format not in self.required_formats:
                # Translators: the words in brackets are replaced by something else. For the code to work properly you should leave the brackets and the words inside of them as-is. You can move them around (i.e. copy-paste in different places)
                raise ValidationError(
                    string_format_lazy('Photo does not have the required format. '
                                       'It should be one of the following formats: {formats_list}.',
                                       formats_list=','.join(sorted(list(self.required_formats))))
                )

class RestrictedImageField(models.ImageField):
    def __init__(self, maximum_size=None, required_width=None,
                 required_height=None, required_formats=None,
                 *args, **kwargs):
        super().__init__(*args, **kwargs)
        
        self.validators \
            .append(ImageValidator(maximum_size, required_width,
                                   required_height, required_formats))
