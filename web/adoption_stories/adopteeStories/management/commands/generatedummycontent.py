from django.core.management.base import BaseCommand
from adopteeStories import ContentGeneration


class Command(BaseCommand):
    help = 'Only for development purposes: Generates models with filler values'

    def handle(self, *args, **options):
        ContentGeneration.generate_test_content()
