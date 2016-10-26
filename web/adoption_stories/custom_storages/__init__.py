from django.conf import settings
from storages.backends.s3boto import S3BotoStorage

class MediaStorage(S3BotoStorage):
    bucket_name = settings.AWS_MEDIA_STORAGE_BUCKET_NAME


class StaticStorage(S3BotoStorage):
    bucket_name = settings.AWS_STATIC_STORAGE_BUCKET_NAME
