from django.conf import settings

# WARNING: DON'T ALTER THIS WITHOUT UNDERSTANDING THE WAY THAT IT IS USED
# AND THE IMPLICATIONS OF CHANGING IT
ADOPTEE_STORIES_CONFIG = {
    'MIN_WIDTH': 400,
    'MIN_HEIGHT': 400,
    'FORMATS': {'JPEG',
                },
    'IMAGE_MAX_SIZE': int(2.5 * 2 ** 20),  # 2.5 megabytes
    'PHOTO_FRONT_STORY_HEIGHT': 272,
    'PHOTO_FRONT_STORY_WIDTH': 720,
    'PHOTO_FRONT_STORY_MAX_SIZE': int(400 * 2 ** 10),  # 400 kilobytes
    'ABOUT_PHOTO_WIDTH': 700,
    'ABOUT_PHOTO_HEIGHT': 700,
    'ABOUT_PHOTO_MAX_SIZE': int(400 * 2 ** 10),  # 400 kilobytes
}

USER_SETTINGS = getattr(settings, 'ADOPTEE_STORIES_CONFIG', None)

if USER_SETTINGS:
    for key, value in USER_SETTINGS.items():
        ADOPTEE_STORIES_CONFIG[key] = value
