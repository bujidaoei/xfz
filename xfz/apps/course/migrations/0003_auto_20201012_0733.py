# Generated by Django 3.1.2 on 2020-10-11 23:33

from django.db import migrations
import shortuuidfield.fields


class Migration(migrations.Migration):

    dependencies = [
        ('course', '0002_courseorder'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='courseorder',
            name='id',
        ),
        migrations.AddField(
            model_name='courseorder',
            name='uid',
            field=shortuuidfield.fields.ShortUUIDField(blank=True, editable=False, max_length=22, primary_key=True, serialize=False),
        ),
    ]