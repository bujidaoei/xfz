#encoding: utf-8
from rest_framework import serializers
from .models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        # 密码字段不需要(你不可能在新闻页面显示作者密码吧，哈哈)
        fields = ('uid','telephone','username','email','is_staff','is_active')