import json

from adopteeStories import ContentGeneration
from django.core.files.base import ContentFile
import io
from PIL import Image
from adopteeStories.models import Adoptee, StoryTeller, RelationshipCategory, Photo, Video, Audio
from django.core.urlresolvers import reverse
from django.test import TestCase, Client
from django.conf import settings
from .ContentGeneration import create_random_photo, create_random_image_file
from .default_settings import ADOPTEE_STORIES_CONFIG as config


# Create your tests here.

# TODO: Clean up redundancy in these tests by abstracting behavior in rest tests
# TODO: Clean up redundancy by abstracting dummy value generation

class AdopteeSearchTestCase(TestCase):
    def setUp(self):
        self.adoptees = [
            Adoptee(english_name='Madeline Jing-Mei',
                    pinyin_name='Jǐngměi',
                    chinese_name='景美'),
            Adoptee(english_name='Kim Bla', ),
            Adoptee(english_name='Search Test',
                    pinyin_name='Lala',
                    chinese_name='搜索的一例'),
            Adoptee(chinese_name='景',
                    pinyin_name='Lola')
        ]
        for adoptee in self.adoptees:
            adoptee.save()

        self.relationship = RelationshipCategory(approved=True)
        self.relationship.save()

        prototypical_storyteller_kw_args = {'story_text': 'bs',
                                            'email': 'bs@example.com',
                                            'approved': True,
                                            'relationship_to_story': self.relationship,
                                            }
        self.storytellers = [StoryTeller(related_adoptee=adoptee,
                                         **prototypical_storyteller_kw_args)
                             for adoptee in self.adoptees]

        self.photos = []

        for storyteller in self.storytellers:
            storyteller.save()
            self.photos.append(create_random_photo(storyteller))

        for adoptee, storyteller, photo in zip(self.adoptees, self.storytellers, self.photos):
            adoptee.front_story = storyteller
            image_file = create_random_image_file(config['PHOTO_FRONT_STORY_WIDTH'],
                                                  config['PHOTO_FRONT_STORY_HEIGHT'])
            adoptee.photo_front_story.save('bs.jpg', ContentFile(image_file.getvalue()))
            adoptee.save()

        self.c = Client()
        self.adoptee_search_url_name = 'adopteeSearch'

    def test_adoptee_search2(self):
        """
        Search with first Latin letter matching an english name should get that adoptee
        when the adoptee has an approved storyteller and front page story and photo front story
        """
        response = self.c.get(reverse(self.adoptee_search_url_name, args=['Mad']))
        # TODO: Abstract the JSON building here
        m_jing_mei_json = '{{"english_name": "{0.english_name}",' \
                          ' "pinyin_name": "{0.pinyin_name}",' \
                          ' "chinese_name": "{0.chinese_name}",' \
                          ' "id": {0.id},' \
                          ' "photo_front_story": "http://testserver{0.photo_front_story.url}"}}'.format(self.adoptees[0])
        expected_response = '{{"next":null,"previous":null,"results":[{}]}}' \
            .format(m_jing_mei_json)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)

    def test_adoptee_search4(self):
        """
        Search with first Latin letter matching an english name should get nothing
        when the adoptee has no front page story chosen
        """
        self.adoptees[0].front_story = None
        self.adoptees[0].save()
        response = self.c.get(reverse(self.adoptee_search_url_name, args=['Mad']))
        # TODO: Abstract the JSON building here
        expected_response = '{"next":null,"previous":null,"results":[]}'
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)

    def test_adoptee_search3(self):
        """
        Search with first Chinese character matching multiple should get both
        """
        response = self.c.get(reverse(self.adoptee_search_url_name, args=['景']))
        # TODO: Abstract the JSON building here
        m_jing_mei_json = '{{"english_name": "{0.english_name}",' \
                          ' "pinyin_name": "{0.pinyin_name}",' \
                          ' "chinese_name": "{0.chinese_name}",' \
                          ' "id": {0.id},' \
                          ' "photo_front_story": "http://testserver{0.photo_front_story.url}"}}'.format(self.adoptees[0])
        lola_json = '{{"english_name": null,' \
                    ' "pinyin_name": "{0.pinyin_name}",' \
                    ' "chinese_name": "{0.chinese_name}",' \
                    ' "id": {0.id},' \
                    ' "photo_front_story": "http://testserver{0.photo_front_story.url}"}}'.format(self.adoptees[3])
        expected_response = '{{"next":null,"previous":null,"results":[{0}, {1}]}}' \
            .format(lola_json, m_jing_mei_json)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)

    def test_adoptee_search_doesnt_fail_on_followup(self):
        """
        Search endpoint paginates correctly
        """
        ContentGeneration.generate_test_content(number_of_adoptees=settings.REST_FRAMEWORK['PAGE_SIZE'] + 1)
        response = self.c.get(reverse(self.adoptee_search_url_name, args=['M']))
        json_response = json.JSONDecoder().decode(response.content.decode('utf-8'))
        next_url = json_response['next']
        response = self.c.get(next_url)
        self.assertEqual(response.status_code, 200)

    def test_adoptee_search_works_with_space(self):
        """
        A space character in the url doesn't ruin everything
        """
        response = self.c.get(reverse(self.adoptee_search_url_name, args=['ne j']))
        # TODO: Abstract the JSON building here
        m_jing_mei_json = '{{"english_name": "{0.english_name}",' \
                          ' "pinyin_name": "{0.pinyin_name}",' \
                          ' "chinese_name": "{0.chinese_name}",' \
                          ' "id": {0.id},' \
                          ' "photo_front_story": "http://testserver{0.photo_front_story.url}"}}'.format(self.adoptees[0])
        expected_response = '{{"next":null,"previous":null,"results":[{}]}}' \
            .format(m_jing_mei_json)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)


class AdopteeGetTestCase(TestCase):
    maxDiff = None

    def setUp(self):
        self.adoptees = [
            Adoptee(english_name='Madeline Jing-Mei',
                    pinyin_name='Jǐngměi',
                    chinese_name='景美'),
            Adoptee(english_name='Kim Bla', ),
            Adoptee(chinese_name='景',
                    pinyin_name='Lola'),
            Adoptee(english_name='Search Test',
                    pinyin_name='Lala',
                    chinese_name='搜索的一例'),
        ]
        for adoptee in self.adoptees:
            adoptee.save()

        self.relationship = RelationshipCategory(approved=True)
        self.relationship.save()

        prototypical_storyteller_kw_args = {'story_text': 'bsbs',
                                            'email': 'bs@example.com',
                                            'approved': True,
                                            'relationship_to_story': self.relationship,
                                            }
        self.storytellers = [StoryTeller(related_adoptee=adoptee,
                                         **prototypical_storyteller_kw_args)
                             for adoptee in self.adoptees]

        self.photos = []

        for adoptee, storyteller in zip(self.adoptees, self.storytellers):
            storyteller.save()
            photo = create_random_photo(storyteller)
            self.photos.append(photo)
            adoptee.front_story = storyteller
            image_file = create_random_image_file(config['PHOTO_FRONT_STORY_WIDTH'],
                                                  config['PHOTO_FRONT_STORY_HEIGHT'])
            adoptee.photo_front_story.save('bs.jpg', ContentFile(image_file.getvalue()))
            adoptee.save()

        self.c = Client()
        self.adoptee_list_url = reverse('adopteeList')

    def test_adoptee_list_shows_approved_adoptees(self):
        """
        Adoptee list endpoint shows adoptees with approved storytellers
        """
        for storyteller in self.storytellers[1::2]:
            storyteller.approved = False
            storyteller.save()

        for adoptee, storyteller in zip(self.adoptees[::2], self.storytellers[::2]):
            adoptee.front_story = storyteller
            adoptee.save()

        response = self.c.get(self.adoptee_list_url)

        m_jing_mei_json = '{{"english_name": "{0.english_name}",' \
                          ' "pinyin_name": "{0.pinyin_name}",' \
                          ' "chinese_name": "{0.chinese_name}",' \
                          ' "id": {0.id},' \
                          ' "photo_front_story": "http://testserver{0.photo_front_story.url}",' \
                          ' "front_story": {{"story_text": "bsbs"}} }}'.format(self.adoptees[0])
        lola_json = '{{"english_name": null,' \
                    ' "pinyin_name": "{0.pinyin_name}",' \
                    ' "chinese_name": "{0.chinese_name}",' \
                    ' "id": {0.id},' \
                    ' "photo_front_story": "http://testserver{0.photo_front_story.url}",' \
                    ' "front_story": {{"story_text": "bsbs"}} }}'.format(self.adoptees[2])
        expected_response = '{{"next":null,"previous":null,"results":[{0}, {1}]}}' \
            .format(lola_json, m_jing_mei_json)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)

    def test_adoptee_list_doesnt_show_adoptees_without_front_story(self):
        """
        If the administrator has not assigned adoptees a story, they should not
        show up in the list endpoint
        """
        for storyteller in self.storytellers[1::2]:
            storyteller.approved = False
            storyteller.save()

        for adoptee in self.adoptees:
            adoptee.front_story = None
            adoptee.save()

        self.adoptees[2].front_story = self.storytellers[2]
        self.adoptees[2].save()

        response = self.c.get(self.adoptee_list_url)

        lola_json = '{{"english_name": null,' \
                    ' "pinyin_name": "{0.pinyin_name}",' \
                    ' "chinese_name": "{0.chinese_name}",' \
                    ' "id": {0.id},' \
                    ' "photo_front_story": "http://testserver{0.photo_front_story.url}",' \
                    ' "front_story": {{"story_text": "bsbs"}} }}'.format(self.adoptees[2])
        expected_response = '{{"next":null,"previous":null,"results":[{0}]}}' \
            .format(lola_json)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)

    def test_adoptee_detail_get_formats_correctly(self):
        """
        Adoptee detail get fetches full adoptee detail correctly
        """
        relationship_json = '{{"english_name": null,' \
                            '  "chinese_name": null,' \
                            '  "id": {0.id}}}'.format(self.relationship)

        photo_json = '{{"chinese_caption": "{0.chinese_caption}",' \
                     '  "english_caption": "{0.english_caption}",' \
                     '  "id": {0.id},' \
                     '  "photo_file": "{0.photo_file.url}",' \
                     '  "story_teller": {0.story_teller.id}}}'.format(self.photos[0])

        story_json = '{{"story_text": "bsbs",' \
                     '  "english_name": null,' \
                     '  "chinese_name": null,' \
                     '  "pinyin_name": null,' \
                     '  "relationship_to_story": {0},' \
                     '  "media": {{' \
                     '            "audio": [],' \
                     '            "photo": [{1}],' \
                     '            "video": []' \
                     '}}' \
                     '}}' \
            .format(relationship_json, photo_json)

        m_jing_mei_json = '{{"english_name": "{0.english_name}",' \
                          ' "pinyin_name": "{0.pinyin_name}",' \
                          ' "chinese_name": "{0.chinese_name}",' \
                          ' "id": {0.id},' \
                          ' "stories": [{1}]}}' \
            .format(self.adoptees[0], story_json)

        response = self.c.get(reverse('adopteeDetail', args=[self.adoptees[0].id]))
        self.assertJSONEqual(response.content.decode('utf-8'),
                             m_jing_mei_json)

    def test_adoptee_detail_doesnt_show_adoptee_without_approved_story(self):
        self.storytellers[0].approved = False
        self.storytellers[0].save()
        response = self.c.get(reverse('adopteeDetail', args=[self.adoptees[0].id]))
        self.assertEqual(response.status_code, 404)


class AdopteeCreateTestCase(TestCase):
    def setUp(self):
        self.c = Client()
        self.adoptee_create_url = reverse('adopteeCreate')

    def test_possible_to_create_full_adoptee_through_api(self):
        response = self.c.post(self.adoptee_create_url,
                               content_type="application/json",
                               data='{"english_name": "Madeleine Jing-Mei",'
                                    ' "pinyin_name":  "Jǐngměi",'
                                    ' "chinese_name": "景美"}')
        self.assertEqual(response.status_code, 201)
        qs = Adoptee.objects.all()
        self.assertEqual(len(qs), 1)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             '{{"id": {0.id}}}'.format(qs[0]))
        # adoptee should be unreachable because they're not yet approved
        response = self.c.get(reverse('adopteeDetail', args=[qs[0].id]))
        self.assertEqual(response.status_code, 404)


class StorytellerCreateTestCase(TestCase):
    def setUp(self):
        self.adoptees = [
            Adoptee(english_name='Madeline Jing-Mei',
                    pinyin_name='Jǐngměi',
                    chinese_name='景美'),
            Adoptee(english_name='Kim Bla', ),
            Adoptee(english_name='Search Test',
                    pinyin_name='Lala',
                    chinese_name='搜索的一例'),
            Adoptee(chinese_name='景',
                    pinyin_name='Lola')
        ]
        for adoptee in self.adoptees:
            adoptee.save()

        self.c = Client()
        self.storyteller_create_url = reverse('storytellerCreate')
        self.relationship = RelationshipCategory(english_name='test')
        self.relationship.save()

    def test_possible_to_create_storyteller_through_api(self):
        response = self.c.post(self.storyteller_create_url,
                               content_type="application/json",
                               data='{{"relationship_to_story": {0.id},'
                                    '  "story_text": "bs",'
                                    '  "email": "bs@example.com",'
                                    '  "related_adoptee": {1.id},'
                                    '  "english_name": "mark",'
                                    '  "chinese_name": null,'
                                    '  "pinyin_name": null}}'
                               .format(self.relationship, self.adoptees[0]))
        self.assertEqual(response.status_code, 201)

        qs = StoryTeller.objects.all()
        self.assertEqual(len(qs), 1)
        self.assertEqual(qs[0].relationship_to_story, self.relationship)
        self.assertEqual(qs[0].related_adoptee, self.adoptees[0])
        self.assertJSONEqual(response.content.decode('utf-8'),
                             '{{"id": {0.id}}}'.format(qs[0]))


class CategoryGetTestCase(TestCase):
    def setUp(self):
        self.c = Client()
        self.relationship = RelationshipCategory(english_name='test')
        self.relationship.save()
        self.category_url = reverse('categoryListAndCreate')

    def test_unapproved_category_not_listed(self):
        response = self.c.get(self.category_url)
        expected_response = '[]'
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)

    def test_approved_category_listed(self):
        self.relationship.approved = True
        self.relationship.save()

        response = self.c.get(self.category_url)
        relationship_json = '{{"english_name": "{0.english_name}",' \
                            '  "chinese_name": null,' \
                            '  "id": {0.id}}}'.format(self.relationship)

        expected_response = '[{}]'.format(relationship_json)
        self.assertJSONEqual(response.content.decode('utf-8'),
                             expected_response)


class CategoryCreateTestCase(TestCase):
    def setUp(self):
        self.c = Client()
        self.category_url = reverse('categoryListAndCreate')

    def test_category_post(self):
        response = self.c.post(self.category_url, content_type="application/json",
                               data='{"english_name":"test",'
                                    '  "chinese_name":"景"}')
        self.assertEqual(response.status_code, 201)
        qs = RelationshipCategory.objects.all()
        self.assertEqual(len(qs), 1)
        self.assertEqual(qs[0].english_name, "test")
        self.assertEqual(qs[0].chinese_name, "景")
        self.assertJSONEqual(response.content.decode("utf-8"),
                             '{{"id": {0.id}}}'.format(qs[0]))


class PhotoFileUploadTestCase(TestCase):
    def setUp(self):
        self.c = Client()
        self.upload_url = reverse('photoCreate')
        self.MIN_WIDTH = config['MIN_WIDTH']
        self.MIN_HEIGHT = config['MIN_HEIGHT']

        self.adoptees = [
            Adoptee(english_name='Madeline Jing-Mei',
                    pinyin_name='Jǐngměi',
                    chinese_name='景美'),
            Adoptee(english_name='Kim Bla', ),
            Adoptee(chinese_name='景',
                    pinyin_name='Lola'),
            Adoptee(english_name='Search Test',
                    pinyin_name='Lala',
                    chinese_name='搜索的一例'),
        ]
        for adoptee in self.adoptees:
            adoptee.save()

        self.relationship = RelationshipCategory(approved=True)
        self.relationship.save()

        prototypical_storyteller_kw_args = {'story_text': 'bsbs',
                                            'email': 'bs@example.com',
                                            'approved': True,
                                            'relationship_to_story': self.relationship,
                                            }
        self.storytellers = [StoryTeller(related_adoptee=adoptee,
                                         **prototypical_storyteller_kw_args)
                             for adoptee in self.adoptees]

        for i, storyteller in enumerate(self.storytellers):
            storyteller.save()
            adoptee = self.adoptees[i]
            adoptee.front_story = storyteller
            adoptee.save()

    def test_file_post_for_valid_photo(self):
        """
        test file uploads with valid photo sizes
        """

        edgeSizeImage = Image.new('RGB', (self.MIN_WIDTH, self.MIN_HEIGHT), (255, 255, 255))
        nonEdgeSizeImage = Image.new('RGB', (int(self.MIN_WIDTH * 1.5), int(self.MIN_HEIGHT * 1.5)), (255, 255, 255))

        fakeFile = io.BytesIO()
        edgeSizeImage.save(fakeFile, format="JPEG")
        fakeFile.name = 'myTestImage.jpg'
        fakeFile.seek(0)
        response = self.c.post(self.upload_url, {'photo_file': fakeFile,
                                                 'english_caption': 'english',
                                                 'chinese_caption': '',
                                                 'story_teller': self.storytellers[0].id})
        self.assertEqual(response.status_code, 201)
        qs = Photo.objects.all()
        self.assertEqual(len(qs), 1)
        fakeFile.seek(0)
        self.assertEqual(qs[0].photo_file.read(), fakeFile.getvalue())
        self.assertJSONEqual(response.content.decode('utf-8'),
                             '{{"id":{0.id}}}'.format(qs[0]))
        self.assertEqual(qs[0].english_caption, 'english')
        self.assertEqual(qs[0].chinese_caption, None)

        qs.delete()

        fakeFile = io.BytesIO()
        nonEdgeSizeImage.save(fakeFile, format="JPEG")
        fakeFile.name = 'myTestImage.jpg'
        fakeFile.seek(0)
        response = self.c.post(self.upload_url, {'photo_file': fakeFile,
                                                 'english_caption': 'english',
                                                 'chinese_caption': '',
                                                 'story_teller': self.storytellers[0].id})
        self.assertEqual(response.status_code, 201)
        qs = Photo.objects.all()
        self.assertEqual(len(qs), 1)
        fakeFile.seek(0)
        self.assertEqual(qs[0].photo_file.read(), fakeFile.getvalue())
        self.assertJSONEqual(response.content.decode('utf-8'),
                             '{{"id":{0.id}}}'.format(qs[0]))

    def test_file_post_for_invalid_photo_dimensions(self):
        badImage = Image.new('RGB', (int(self.MIN_WIDTH * .5), int(self.MIN_HEIGHT * .5)), (255, 255, 255))
        fakeFile = io.BytesIO()
        badImage.save(fakeFile, format="JPEG")
        fakeFile.name = 'myTestImage.jpg'
        fakeFile.seek(0)
        response = self.c.post(self.upload_url, {'photo_file': fakeFile,
                                                 'english_caption': 'english',
                                                 'chinese_caption': '',
                                                 'story_teller': self.storytellers[0].id})
        self.assertEqual(response.status_code, 400)
        qs = Photo.objects.all()
        self.assertEqual(len(qs), 0)

    def test_file_post_for_invalid_photo_format(self):
        nonEdgeSizeImage = Image.new('RGB', (int(self.MIN_WIDTH * 1.5), int(self.MIN_HEIGHT * 1.5)), (255, 255, 255))
        fakeFile = io.BytesIO()
        nonEdgeSizeImage.save(fakeFile, format="PNG")
        fakeFile.name = 'myTestImage.png'
        fakeFile.seek(0)
        response = self.c.post(self.upload_url, {'photo_file': fakeFile,
                                                 'english_caption': 'english',
                                                 'chinese_caption': '',
                                                 'story_teller': self.storytellers[0].id})
        self.assertEqual(response.status_code, 400)
        qs = Photo.objects.all()
        self.assertEqual(len(qs), 0)

        fakeFile.name = 'myTestImage.jpg'
        fakeFile.seek(0)
        response = self.c.post(self.upload_url, {'photo_file': fakeFile,
                                                 'english_caption': 'english',
                                                 'chinese_caption': '',
                                                 'story_teller': self.storytellers[0].id})
        self.assertEqual(response.status_code, 400)
        qs = Photo.objects.all()
        self.assertEqual(len(qs), 0)

    def test_file_post_for_invalid_photo_content(self):
        fakeFile = io.BytesIO(b"lolzi'ma1337hacker")
        fakeFile.name = 'myTestImage.jpg'
        fakeFile.seek(0)
        response = self.c.post(self.upload_url, {'photo_file': fakeFile,
                                                 'english_caption': 'english',
                                                 'chinese_caption': '',
                                                 'story_teller': self.storytellers[0].id})
        self.assertEqual(response.status_code, 400)
        qs = Photo.objects.all()
        self.assertEqual(len(qs), 0)

    # TODO: Test validation with a file that is too large

# TODO: Make a parent class for VideoCreateTestCase and AudioCreateTestCase, because they're literally just copy paste with a few changed variables
class VideoCreateTestCase(TestCase):
    VALID_YOUTUBE_URLS = ["https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                          ]
    INVALID_YOUTUBE_URLS = [
        # "https://www.youtube.com/watch?v=dQw4w9W,b",  #TODO: Add validation against youtube rest endpoint
        "https://www.soundcloud.com/watch?v=dQw4w9WgXcQ"]
    VIDEO_CREATE_URL = reverse('videoCreate')

    def setUp(self):
        self.c = Client()

        relationship = RelationshipCategory(approved=True)
        relationship.save()

        adoptee = Adoptee(english_name='Madeline Jing-Mei',
                          pinyin_name='Jǐngměi',
                          chinese_name='景美')
        adoptee.save()

        prototypical_storyteller_kw_args = {'story_text': 'bs',
                                            'email': 'bs@example.com',
                                            'approved': True,
                                            'relationship_to_story': relationship,
                                            'related_adoptee': adoptee,
                                            }

        self.storyteller = StoryTeller(**prototypical_storyteller_kw_args)
        self.storyteller.save()

    def test_create_valid_video(self):
        for video_url in self.VALID_YOUTUBE_URLS:
            post_json = '{{"english_caption": "a lovely walk in the park",' \
                        '  "chinese_caption": "景美景美景美景美景美景美景美",' \
                        '  "story_teller": {0.id},' \
                        '  "video": "{1}"}}'.format(self.storyteller,
                                                    video_url)

            response = self.c.post(self.VIDEO_CREATE_URL,
                                   data=post_json,
                                   content_type='application/json')
            self.assertEqual(response.status_code, 201)
            queryset = Video.objects.all()
            self.assertEqual(len(queryset), 1)
            self.assertJSONEqual(response.content.decode('utf-8'),
                                 '{{"id":{0.id}}}'.format(queryset[0]))
            queryset.delete()

    def test_create_invalid_video(self):
        for video_url in self.INVALID_YOUTUBE_URLS:
            post_json = '{{"english_caption": "a lovely walk in the park",' \
                        '  "chinese_caption": "景美景美景美景美景美景美景美",' \
                        '  "story_teller": {0.id},' \
                        '  "video": "{1}"}}'.format(self.storyteller,
                                                    video_url)

            response = self.c.post(self.VIDEO_CREATE_URL,
                                   data=post_json,
                                   content_type='application/json')
            self.assertEqual(response.status_code, 400)
            queryset = Video.objects.all()
            self.assertEqual(len(queryset), 0)


class AudioCreateTestCase(TestCase):
    VALID_SOUNDCLOUD_URLS = ["https://soundcloud.com/andreasedstr-m/rick-astley-never-gonna-give",
                             ]
    INVALID_SOUNDCLOUD_URLS = ["https://www.youtube.com/watch?v=dQw4w9W,b",
                               "https://www.soundcloud.com/watch?v=dQw4w9WgXcQ",
                               "https://soundcloud.com/andreasedstr-m/rick-astley-never-gonna-g",
                               "https://soundcloud.com/helterskelter-beatles-c"]
    AUDIO_CREATE_URL = reverse('audioCreate')

    def setUp(self):
        self.c = Client()

        relationship = RelationshipCategory(approved=True)
        relationship.save()

        adoptee = Adoptee(english_name='Madeline Jing-Mei',
                          pinyin_name='Jǐngměi',
                          chinese_name='景美')
        adoptee.save()

        prototypical_storyteller_kw_args = {'story_text': 'bs',
                                            'email': 'bs@example.com',
                                            'approved': True,
                                            'relationship_to_story': relationship,
                                            'related_adoptee': adoptee,
                                            }

        self.storyteller = StoryTeller(**prototypical_storyteller_kw_args)
        self.storyteller.save()

    def test_create_valid_video(self):
        for video_url in self.VALID_SOUNDCLOUD_URLS:
            post_json = '{{"english_caption": "a lovely walk in the park",' \
                        '  "chinese_caption": "景美景美景美景美景美景美景美",' \
                        '  "story_teller": {0.id},' \
                        '  "audio": "{1}"}}'.format(self.storyteller,
                                                    video_url)

            response = self.c.post(self.AUDIO_CREATE_URL,
                                   data=post_json,
                                   content_type='application/json')
            self.assertEqual(response.status_code, 201)
            queryset = Audio.objects.all()
            self.assertEqual(len(queryset), 1)
            self.assertJSONEqual(response.content.decode('utf-8'),
                                 '{{"id":{0.id}}}'.format(queryset[0]))
            queryset.delete()

    def test_create_invalid_video(self):
        for video_url in self.INVALID_SOUNDCLOUD_URLS:
            post_json = '{{"english_caption": "a lovely walk in the park",' \
                        '  "chinese_caption": "景美景美景美景美景美景美景美",' \
                        '  "story_teller": {0.id},' \
                        '  "video": "{1}"}}'.format(self.storyteller,
                                                    video_url)

            response = self.c.post(self.AUDIO_CREATE_URL,
                                   data=post_json,
                                   content_type='application/json')
            self.assertEqual(response.status_code, 400)
            queryset = Video.objects.all()
            self.assertEqual(len(queryset), 0)


            # TODO: Add a test relating to null fields in models and their to string methods
            # TODO: Add tests around need for distinct() calls on queries with filters due to the inner joins producing duplicates
