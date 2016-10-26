"""
What started as a one-off script to create some test content for the site.
Now coupled with the test code for this site in quite a few ways and a definite
source of technical debt. If you end up using this for your own purposes,
I would highly recommend giving it some structure and testability
"""
from collections import deque

from django.core.files.base import ContentFile
import io
from PIL import Image

import loremipsum
import random

from .models import Adoptee, Audio, Video, Photo, RelationshipCategory, StoryTeller, AboutPerson
from .default_settings import ADOPTEE_STORIES_CONFIG as config
from .chinese_lorem import ipsum as chinese_lorem


class LoremIpsumProxy():
    """
    Hacky way to account for the fact that our english lorem ipsum returns lists rather than strings
    """

    def __init__(self):
        self.loremipsum = loremipsum

    def get_sentences(self, amount, start_with_lorem=False):
        return ' '.join(loremipsum.get_sentences(amount, start_with_lorem))

    def get_paragraphs(self, amount, start_with_lorem=False):
        return '\n'.join(loremipsum.get_paragraphs(amount, start_with_lorem))


YOUTUBE_VIDEOS = ('https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                  'https://www.youtube.com/watch?v=PYpiQ4gbngc')

SOUNDCLOUD_CLIPS = ('https://soundcloud.com/syed-sarim-ahsen/wake-me-up-avicci-feat-aloe',
                    'https://soundcloud.com/helterskelter-beatles-c/cant-buy-me-love',)

PHOTO_DIMENSION_BOUNDARIES = ((config['MIN_WIDTH'], int(config['MIN_WIDTH'] * 7.5)),
                              (config['MIN_HEIGHT'],
                               int(config['MIN_HEIGHT'] * 7.5)))  # like ((minX, maxX), (minY, maxY))

NUMBER_OF_CAPTION_SENTENCES = (1, 2)  # it's a range [min, max)


def set_other_media_fields(media_item, storyteller):
    media_item.english_caption = LoremIpsumProxy().get_sentences(random.randrange(*NUMBER_OF_CAPTION_SENTENCES))
    media_item.chinese_caption = chinese_lorem.get_sentences(random.randrange(*NUMBER_OF_CAPTION_SENTENCES))
    media_item.approved = True
    media_item.story_teller = storyteller


def create_random_image_file(width, height):
    rgb = tuple([random.randrange(0, 256) for _ in range(3)])
    image = Image.new('RGB', (width, height), rgb)
    image_file = io.BytesIO()
    image.save(image_file, format='JPEG')
    image_file.seek(0)
    return image_file


def create_random_photo(storyteller):
    width = random.randrange(*PHOTO_DIMENSION_BOUNDARIES[0])
    height = random.randrange(*PHOTO_DIMENSION_BOUNDARIES[1])
    photo_file = create_random_image_file(width, height)
    photo = Photo()
    photo.photo_file.save('bs.jpg', ContentFile(photo_file.getvalue()))
    set_other_media_fields(photo, storyteller)
    photo.save()
    return photo


def create_random_video(storyteller):
    video = Video(video=random.choice(YOUTUBE_VIDEOS))
    set_other_media_fields(video, storyteller)
    video.save()
    return video


def create_random_audio(storyteller):
    audio = Audio(audio=random.choice(SOUNDCLOUD_CLIPS))
    set_other_media_fields(audio, storyteller)
    audio.save()
    return audio


def create_about_people(number_of_people):
    PEOPLE_NAMES = (('Karen', 'Wilbanks'), ('Josh', 'Duggar'), ('Brandon', 'Mond'),
                    ('Jena', 'Heath', '姓名', 'xing-ming'))
    NUMBER_OF_ABOUT_PARAGRAPHS = (1, 3)  # it's a range [min, max)
    for i in range(number_of_people):
        image_file = create_random_image_file(config['ABOUT_PHOTO_WIDTH'],
                                              config['ABOUT_PHOTO_HEIGHT'])
        english_caption = LoremIpsumProxy().get_sentences(random.randrange(*NUMBER_OF_CAPTION_SENTENCES))
        chinese_caption = chinese_lorem.get_sentences(random.randrange(*NUMBER_OF_CAPTION_SENTENCES))
        number_of_paragraphs = random.randrange(*NUMBER_OF_ABOUT_PARAGRAPHS)
        about_text_english = LoremIpsumProxy().get_paragraphs(number_of_paragraphs)
        about_text_chinese = chinese_lorem.get_paragraphs(number_of_paragraphs)
        english_name = " ".join([random.choice(PEOPLE_NAMES)[0],
                                 random.choice(PEOPLE_NAMES)[1]])
        choice = random.choice(PEOPLE_NAMES)
        try:
            chinese_name = choice[2]
            pinyin_name = choice[3]
        except IndexError:
            chinese_name = None
            pinyin_name = None
        person = AboutPerson(english_caption=english_caption,
                             chinese_caption=chinese_caption,
                             about_text_english=about_text_english,
                             about_text_chinese=about_text_chinese,
                             english_name=english_name,
                             chinese_name=chinese_name,
                             pinyin_name=pinyin_name,
                             order=i,
                             published=True)
        person.photo.save('bs.jpg', ContentFile(image_file.getvalue()))
        person.save()


def generate_test_content(number_of_adoptees=100, number_of_about_people=6):
    create_about_people(number_of_about_people)

    STORYTELLER_NAMES = (('Karen', 'Wilbanks'), ('Josh', 'Duggar'), ('Brandon', 'Mond'),
                         ('Jena', 'Heath', '姓名', 'xing-ming'))

    ADOPTEE_NAMES = (('Madeline', 'Jǐngměi', '景美'), ('Stephen', 'xing-ming', '姓名'))

    RELATIONSHIPS = [('Biological Father', '关系'), ('Biological Mother', '关系'),
                     ('Adoptive Father', '关系'), ('Adoptive Mother', '关系'),
                     ('Teacher', '关系'), ('Parents', '关系')]

    for i in range(len(RELATIONSHIPS)):
        RELATIONSHIPS[i] = RelationshipCategory \
            .objects.create(english_name=RELATIONSHIPS[i][0],
                            chinese_name=RELATIONSHIPS[i][1],
                            approved=True)

    NUMBER_OF_STORIES_PER_ADOPTEE = (1, 6)  # it's a range [min, max)
    NUMBER_OF_PARAGRAPHS_IN_A_STORY = (4, 14)  # it's a range [min, max)

    for i in range(number_of_adoptees):  # create an adoptee and all of the

        adoptee = Adoptee.objects.create(english_name=random.choice(ADOPTEE_NAMES)[0],
                                         pinyin_name=random.choice(ADOPTEE_NAMES)[1],
                                         chinese_name=random.choice(ADOPTEE_NAMES)[2])

        relationships = RELATIONSHIPS[:]
        random.shuffle(relationships)
        relationships = deque(relationships)
        random_photos = []

        # people who are in their life
        number_of_storytellers = random.randrange(*NUMBER_OF_STORIES_PER_ADOPTEE)
        storytellers = []
        for j in range(number_of_storytellers):
            number_of_paragraphs = random.randrange(*NUMBER_OF_PARAGRAPHS_IN_A_STORY)
            english_name = " ".join([random.choice(STORYTELLER_NAMES)[0],
                                     random.choice(STORYTELLER_NAMES)[1]])
            choice = random.choice(STORYTELLER_NAMES)
            try:
                chinese_name = choice[2]
                pinyin_name = choice[3]
            except IndexError:
                chinese_name = None
                pinyin_name = None

            story_text = random.choice([LoremIpsumProxy().get_paragraphs,
                                        chinese_lorem.get_paragraphs])(number_of_paragraphs)

            storyteller = StoryTeller \
                .objects.create(relationship_to_story=relationships.pop(),
                                story_text=story_text,
                                email="storyteller@example.com",
                                approved=True,
                                related_adoptee=adoptee,
                                english_name=english_name,
                                chinese_name=chinese_name,
                                pinyin_name=pinyin_name)

            random.choice([create_random_video,
                           create_random_audio])(storyteller)
            random_photos.append(create_random_photo(storyteller))
            storytellers.append(storyteller)

        adoptee.front_story = random.choice(storytellers)
        front_story_image_file = create_random_image_file(config['PHOTO_FRONT_STORY_WIDTH'],
                                                          config['PHOTO_FRONT_STORY_HEIGHT'])
        adoptee.photo_front_story.save('bs.jpg',
                                       ContentFile(front_story_image_file.getvalue()))

        adoptee.save()
