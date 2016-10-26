from .default_settings import ADOPTEE_STORIES_CONFIG as config
from .custom_rest_fields import SoundcloudField, YoutubeField
from .models import Adoptee, Photo, StoryTeller, RelationshipCategory, Audio, Video, AboutPerson

from django import forms
from django.utils.translation import ugettext_lazy as _
from embed_video.backends import YoutubeBackend
from rest_framework import serializers


class AudioLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audio
        fields = ('audio',)


class VideoLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ('video',)


class StoryTextSerializer(serializers.Serializer):
    story_text = serializers.SerializerMethodField()

    def get_story_text(self, instance):
        return instance.story_text


class AdopteeBasicsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Adoptee
        fields = ('english_name', 'pinyin_name', 'chinese_name', 'id',)


class AdopteeSearchSerializer(AdopteeBasicsSerializer):
    class Meta(AdopteeBasicsSerializer.Meta):
        fields = AdopteeBasicsSerializer.Meta.fields + ('photo_front_story',)


class AdopteeListSerializer(AdopteeBasicsSerializer):
    front_story = StoryTextSerializer(many=False)

    class Meta(AdopteeBasicsSerializer.Meta):
        fields = AdopteeBasicsSerializer.Meta.fields + ('photo_front_story',
                                                        'front_story',)


class RelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = RelationshipCategory
        fields = ('english_name', 'chinese_name', 'id',)


class StoryBasicsSerializer(serializers.ModelSerializer):
    story_text = serializers.SerializerMethodField()

    def get_story_text(self, instance):
        return instance.story_text

    class Meta:
        model = StoryTeller
        fields = ('story_text', 'english_name', 'chinese_name', 'pinyin_name',)


class StoryCreationSerializer(StoryBasicsSerializer):
    story_text = serializers.CharField(allow_blank=False,
                                       trim_whitespace=True)

    class Meta(StoryBasicsSerializer.Meta):
        fields = StoryBasicsSerializer.Meta.fields + ('relationship_to_story',
                                                      'email',
                                                      'related_adoptee',)


class AdopteeDetailSerializer(AdopteeBasicsSerializer):
    stories = serializers.SerializerMethodField()

    def get_stories(self, instance):
        ordered_stories = StoryTeller.objects.all() \
            .filter(related_adoptee=instance, approved=True,
                    photo__approved=True)\
            .distinct()
        return StorySerializer(ordered_stories, many=True).data

    class Meta(AdopteeBasicsSerializer.Meta):
        fields = AdopteeBasicsSerializer.Meta.fields + ('stories',)


class RestrictedDjangoImageField(forms.ImageField):
    def to_python(self, data):
        """
        Checks that the file-upload field contains a JPEG, and nothing else.
        Uses PIL validation and also ensures that the file is above a minimum height and width
        """

        min_width, min_height, formats, max_size = config['MIN_WIDTH'], config['MIN_HEIGHT'], config['FORMATS'], \
                                                   config['IMAGE_MAX_SIZE']

        # While a lot of validation will only be carried out in-depth on the backend,
        # due to the difficulty of writing it, this size validation will be on the
        # frontend as well. This is because allowing somebody to upload a
        # large file just to get it kicked back would be a huge UX degradation
        # and also a bandwidth hog. This size validation will be accompanied by nginx
        # giving users who try to upload a truly massive file a much ruder experience
        # (dropped connection) to prevent huge server load on our end
        if data.size > max_size:
            # Translators: Error message for people who try to bypass image upload restrictions
            raise serializers.ValidationError(detail=_('Image is too large'))

        file = super(RestrictedDjangoImageField, self).to_python(data)

        width, height = file.image.size

        if width < min_width or height < min_height:
            # Translators: Error message when image is too small
            raise serializers.ValidationError(detail=_('Image does not meet '
                                                       'minimum width and height'
                                                       ' requirements'))
        format = file.image.format

        if format not in formats:
            # Translators: Error message when image is not one of the allowed formats
            raise serializers.ValidationError(detail=_('Image does not meet '
                                                       'formatting requirements'))

        return file


class RestrictedImageField(serializers.ImageField):
    def __init__(self, *args, **kwargs):
        super(RestrictedImageField, self).__init__(*args, **kwargs)
        self._DjangoImageField = RestrictedDjangoImageField


class PhotoFileSerializer(serializers.Serializer):
    photo_file = RestrictedImageField()
    english_caption = serializers.CharField(max_length=200, allow_null=True)
    chinese_caption = serializers.CharField(max_length=200, allow_null=True)
    story_teller = serializers.PrimaryKeyRelatedField(queryset=StoryTeller.objects.all())

    def create(self, validated_data):
        return Photo.objects.create(**validated_data)


MULTIMEDIA_FIELDS = ('english_caption', 'chinese_caption', 'story_teller', 'id')


class PhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Photo
        fields = MULTIMEDIA_FIELDS + ('photo_file',)


class AudioSerializer(serializers.ModelSerializer):
    audio = SoundcloudField()

    class Meta:
        model = Audio
        fields = MULTIMEDIA_FIELDS + ('audio',)


class VideoSerializer(serializers.ModelSerializer):
    video = YoutubeField()
    iframe_url = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = MULTIMEDIA_FIELDS + ('video', 'iframe_url')

    def get_iframe_url(self, instance):
        backend = YoutubeBackend(instance.video)
        return backend.url


class StorySerializer(StoryBasicsSerializer):
    relationship_to_story = RelationshipSerializer(many=False)
    media = serializers.SerializerMethodField('get_media_field')

    def get_media_field(self, instance):
        querysets = {"audio": (Audio.objects.all(), AudioSerializer),
                     "video": (Video.objects.all(), VideoSerializer),
                     "photo": (Photo.objects.all(), PhotoSerializer), }

        response = {}

        for label, queryset_and_serializer in querysets.items():
            queryset, serializer = queryset_and_serializer
            queryset = queryset.filter(story_teller=instance) \
                .filter(approved=True)
            response[label] = serializer(queryset, many=True).data

        return response

    class Meta(StoryBasicsSerializer.Meta):
        fields = StoryBasicsSerializer.Meta.fields + ('relationship_to_story',
                                                      'media')


class AboutPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPerson
        fields = ('photo', 'english_caption', 'chinese_caption',
                  'about_text_english', 'about_text_chinese',
                  'english_name', 'chinese_name', 'pinyin_name',)
