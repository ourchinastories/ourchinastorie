# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import adopteeStories.custom_model_fields
import embed_video.fields


class Migration(migrations.Migration):

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='AboutPerson',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('photo', adopteeStories.custom_model_fields.RestrictedImageField(verbose_name='Picture of person on about page', upload_to='')),
                ('english_caption', models.CharField(verbose_name='English Caption', max_length=200, blank=True, null=True)),
                ('chinese_caption', models.CharField(verbose_name='Chinese Caption', max_length=200, blank=True, null=True)),
                ('about_text_english', models.TextField(help_text='Should include paragraph markup:e.g. <p>This is a paragraph</p><p>This is a different paragraph</p>', verbose_name='About text for that person.', blank=True, null=True)),
                ('about_text_chinese', models.TextField(help_text='Should include paragraph markup:e.g. <p>This is a paragraph</p><p>This is a different paragraph</p>', verbose_name='About text for that person.', blank=True, null=True)),
                ('published', models.BooleanField(verbose_name='Published status')),
                ('english_name', models.CharField(verbose_name='English Name', max_length=150, blank=True, null=True)),
                ('chinese_name', models.CharField(verbose_name='Chinese Name', max_length=50, blank=True, null=True)),
                ('pinyin_name', models.CharField(verbose_name='Pinyin Name', max_length=150, blank=True, null=True)),
                ('order', models.IntegerField(verbose_name='Position of person in about page')),
            ],
            options={
                'verbose_name': 'About Person',
                'verbose_name_plural': 'About People',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='Adoptee',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('english_name', models.CharField(db_index=True, verbose_name='English Name', max_length=150, blank=True, null=True)),
                ('pinyin_name', models.CharField(db_index=True, verbose_name='Pinyin Name', max_length=150, blank=True, null=True)),
                ('chinese_name', models.CharField(db_index=True, verbose_name='Chinese Name', max_length=50, blank=True, null=True)),
                ('photo_front_story', adopteeStories.custom_model_fields.RestrictedImageField(verbose_name='Photo Front Story', upload_to='', blank=True, null=True)),
                ('created', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated', models.DateTimeField(verbose_name='Updated At', auto_now=True)),
            ],
            options={
                'verbose_name': 'Adoptee',
                'verbose_name_plural': 'Adoptees',
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='Audio',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('english_caption', models.CharField(verbose_name='English Caption', max_length=200, blank=True, null=True)),
                ('chinese_caption', models.CharField(verbose_name='Chinese Caption', max_length=200, blank=True, null=True)),
                ('approved', models.BooleanField(verbose_name='Approved', default=False)),
                ('created', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated', models.DateTimeField(verbose_name='Updated At', auto_now=True)),
                ('audio', embed_video.fields.EmbedSoundcloudField(verbose_name='Audio Soundcloud Embed')),
            ],
            options={
                'verbose_name': 'Audio item',
                'abstract': False,
                'verbose_name_plural': 'Audio items',
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='Photo',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('english_caption', models.CharField(verbose_name='English Caption', max_length=200, blank=True, null=True)),
                ('chinese_caption', models.CharField(verbose_name='Chinese Caption', max_length=200, blank=True, null=True)),
                ('approved', models.BooleanField(verbose_name='Approved', default=False)),
                ('created', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated', models.DateTimeField(verbose_name='Updated At', auto_now=True)),
                ('photo_file', models.ImageField(verbose_name='Photo File', upload_to='')),
            ],
            options={
                'verbose_name': 'Photo',
                'abstract': False,
                'verbose_name_plural': 'Photos',
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='RelationshipCategory',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('english_name', models.CharField(verbose_name='English Name', max_length=30, blank=True, null=True)),
                ('chinese_name', models.CharField(verbose_name='Chinese Name', max_length=30, blank=True, null=True)),
                ('approved', models.BooleanField(verbose_name='Approved', default=False)),
                ('created', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated', models.DateTimeField(verbose_name='Updated At', auto_now=True)),
                ('order', models.IntegerField(verbose_name='Position of relationship category', blank=True, null=True)),
            ],
            options={
                'verbose_name': 'Relationship Category',
                'verbose_name_plural': 'Relationship Categories',
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='StoryTeller',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('story_text', models.TextField(verbose_name='Story Text')),
                ('email', models.EmailField(verbose_name='Email', max_length=254)),
                ('approved', models.BooleanField(verbose_name='Approved', default=False)),
                ('english_name', models.CharField(verbose_name='English Name', max_length=150, blank=True, null=True)),
                ('chinese_name', models.CharField(verbose_name='Chinese Name', max_length=50, blank=True, null=True)),
                ('pinyin_name', models.CharField(verbose_name='Pinyin Name', max_length=150, blank=True, null=True)),
                ('created', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated', models.DateTimeField(verbose_name='Updated At', auto_now=True)),
                ('related_adoptee', models.ForeignKey(to='adopteeStories.Adoptee', verbose_name='Related Adoptee', related_name='stories')),
                ('relationship_to_story', models.ForeignKey(verbose_name='Relationship to Story', to='adopteeStories.RelationshipCategory')),
            ],
            options={
                'verbose_name': 'Story Teller',
                'verbose_name_plural': 'Story Tellers',
                'ordering': ['-created'],
            },
        ),
        migrations.CreateModel(
            name='Video',
            fields=[
                ('id', models.AutoField(auto_created=True, verbose_name='ID', serialize=False, primary_key=True)),
                ('english_caption', models.CharField(verbose_name='English Caption', max_length=200, blank=True, null=True)),
                ('chinese_caption', models.CharField(verbose_name='Chinese Caption', max_length=200, blank=True, null=True)),
                ('approved', models.BooleanField(verbose_name='Approved', default=False)),
                ('created', models.DateTimeField(auto_now_add=True, verbose_name='Created At')),
                ('updated', models.DateTimeField(verbose_name='Updated At', auto_now=True)),
                ('video', embed_video.fields.EmbedYoutubeField(verbose_name='Video Youtube Embed')),
                ('story_teller', models.ForeignKey(to='adopteeStories.StoryTeller', verbose_name='Story Teller', null=True)),
            ],
            options={
                'verbose_name': 'Video item',
                'abstract': False,
                'verbose_name_plural': 'Video items',
                'ordering': ['-created'],
            },
        ),
        migrations.AddField(
            model_name='photo',
            name='story_teller',
            field=models.ForeignKey(to='adopteeStories.StoryTeller', verbose_name='Story Teller', null=True),
        ),
        migrations.AddField(
            model_name='audio',
            name='story_teller',
            field=models.ForeignKey(to='adopteeStories.StoryTeller', verbose_name='Story Teller', null=True),
        ),
        migrations.AddField(
            model_name='adoptee',
            name='front_story',
            field=models.ForeignKey(to='adopteeStories.StoryTeller', verbose_name='Front Story', blank=True, null=True),
        ),
    ]
