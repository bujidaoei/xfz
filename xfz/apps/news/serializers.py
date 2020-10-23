#encoding: utf-8

from rest_framework import serializers
from .models import News,NewsCategory,Comment,Banner
# 导入auth序列化
from apps.xfzauth.serializers import UserSerializer

# category序列化
class NewsCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsCategory
        fields = ('id','name')

class NewsSerializer(serializers.ModelSerializer):
    category = NewsCategorySerializer()
    author = UserSerializer()
    class Meta:
        # 对新闻模型序列化
        model = News
        # 需要序列化哪些字段
        # 内容字段是不需要的,因为内容字段又多又长
        # category和auth需要单独去写(它们只是外键，在News模型中，category和auth真正保存的只是id)
        # 而如category我们不仅仅想要id，还想要如name
        # 由于author在zfzauth这个app下面，因此在xfzauth下写一个序列化(当然不一定非要放到里面来写，只不过放到xfzauth里来写显得更整洁)
        fields = ('id','title','desc','thumbnail','pub_time','category','author')

class CommentSerizlizer(serializers.ModelSerializer):
    author = UserSerializer()
    class Meta:
        model = Comment
        fields = ('id','content','author','pub_time')

class BannerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Banner
        fields = ('id','image_url','priority','link_to')