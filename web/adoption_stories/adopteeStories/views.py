# TODO: Clean up imports list and make it PEP8 compliant
from adopteeStories.models import Adoptee, RelationshipCategory, AboutPerson
from adopteeStories import serializers
from django.db.models import Q

# Create your views here.
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import generics
from rest_framework import status
from rest_framework import mixins


# TODO: Address code debt around these filters

# If you are very keen, you may notice that this filter will allow through
# adoptees with storytellers who are approved, but who do not possess approved
# categories. I noticed this while writing my tests and debated it myself.
# At the end of the day, I decided that I was ok with this. Admins should know
# that approving a storyteller means associated content will be out there with
# that storyteller if it isn't media. This allows granularity in making one-off
# exceptions for relationship categories without bloating the selector as well.
ADOPTEE_FILTERS_Q_OBJECTS = [Q(front_story__isnull=False),
                             Q(front_story__approved=True),
                             Q(photo_front_story__isnull=False),
                             Q(front_story__photo__approved=True),
                             ]
ADOPTEE_FILTER = Q()

for q_object in ADOPTEE_FILTERS_Q_OBJECTS:
    ADOPTEE_FILTER &= q_object

CATEGORY_FILTERS_Q_OBJECTS = [Q(approved=True), ]
CATEGORY_FILTER = Q()

for q_object in CATEGORY_FILTERS_Q_OBJECTS:
    CATEGORY_FILTER &= q_object

UPDATE_FILTER = Q(approved=False)


class AdopteeSearch(generics.ListAPIView):
    serializer_class = serializers.AdopteeListSerializer
    FIELDS_TO_SEARCH_ON = ['english_name', 'pinyin_name', 'chinese_name']
    FILTER_FOR_FIELDS = '__icontains'

    def get_queryset(self):
        userSearch = self.kwargs['q']
        query = Q()

        for field in self.FIELDS_TO_SEARCH_ON:
            query |= Q(**{field + self.FILTER_FOR_FIELDS: userSearch})

        return Adoptee.objects.all().filter(query & ADOPTEE_FILTER).distinct() #


class AdopteeList(generics.ListAPIView):
    #queryset = Adoptee.objects.all().distinct() #filter(ADOPTEE_FILTER).
    serializer_class = serializers.AdopteeListSerializer
    FIELDS_TO_SEARCH_ON = ['english_name', 'pinyin_name', 'chinese_name', 'front_story__story_text']
    FILTER_FOR_FIELDS = '__icontains'
    def get_queryset(self):
        userSearch = self.kwargs['q']
        query = Q()

        for field in self.FIELDS_TO_SEARCH_ON:
            query |= Q(**{field + self.FILTER_FOR_FIELDS: userSearch})
        if userSearch in ['', '999999999']:
            return Adoptee.objects.all().filter(ADOPTEE_FILTER).distinct() #
        else:
            return Adoptee.objects.all().filter(query & ADOPTEE_FILTER).distinct() #
            

class AdopteeDetail(generics.RetrieveAPIView):
    queryset = Adoptee.objects.all().filter(ADOPTEE_FILTER).distinct().order_by("RelationshipCategory__order") #
    serializer_class = serializers.AdopteeDetailSerializer


class GenericCreate(generics.GenericAPIView, mixins.CreateModelMixin):
    def post(self, request, *args, **kwargs):
        return self.create(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        new_model_instance = serializer.save()
        headers = self.get_success_headers(serializer.data)
        return Response({'id': new_model_instance.id}, status=status.HTTP_201_CREATED, headers=headers)


# TODO: Enforce adoptee having a name
class AdopteeCreate(GenericCreate):
    serializer_class = serializers.AdopteeBasicsSerializer


# TODO: Enforce storyteller having a name
class StoryTellerCreate(GenericCreate):
    serializer_class = serializers.StoryCreationSerializer


class CategoryListAndCreate(GenericCreate):
    serializer_class = serializers.RelationshipSerializer
    queryset = RelationshipCategory.objects.all().filter(CATEGORY_FILTER)

    def get(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class GenericUpload(GenericCreate):
    parser_classes = (MultiPartParser,)


class PhotoFileCreate(GenericUpload):
    serializer_class = serializers.PhotoFileSerializer


class AudioCreate(GenericCreate):
    serializer_class = serializers.AudioSerializer


class VideoCreate(GenericCreate):
    serializer_class = serializers.VideoSerializer


# TODO: Add tests around this view
class AboutPersonList(generics.ListAPIView):
    queryset = AboutPerson.objects.all().filter(published=True)
    serializer_class = serializers.AboutPersonSerializer
    pagination_class = PageNumberPagination
