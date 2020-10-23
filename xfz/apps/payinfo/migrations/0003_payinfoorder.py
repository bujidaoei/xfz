# Generated by Django 3.1.2 on 2020-10-14 14:53

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import shortuuidfield.fields


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('payinfo', '0002_auto_20201014_2235'),
    ]

    operations = [
        migrations.CreateModel(
            name='PayinfoOrder',
            fields=[
                ('uid', shortuuidfield.fields.ShortUUIDField(blank=True, editable=False, max_length=22, primary_key=True, serialize=False)),
                ('amount', models.FloatField(default=0)),
                ('pub_time', models.DateTimeField(auto_now_add=True)),
                ('istype', models.SmallIntegerField(default=0)),
                ('status', models.SmallIntegerField(default=1)),
                ('buyer', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to=settings.AUTH_USER_MODEL)),
                ('payinfo', models.ForeignKey(on_delete=django.db.models.deletion.DO_NOTHING, to='payinfo.payinfo')),
            ],
        ),
    ]