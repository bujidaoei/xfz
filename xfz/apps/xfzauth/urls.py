#encoding: utf-8

from django.urls import path
from . import views

app_name = 'xfzauth'

urlpatterns = [
    path('login/',views.login_view,name='login'),
    path('logout/',views.logout_view,name='logout'),
    path('img_captcha/',views.img_captcha,name='img_captcha'),
    path('sms_captcha/',views.sms_captcha,name='sms_captcha'),
    path('register/',views.register,name='register'),
    # 测试能不能存储到memcache的url(与web无关)
    path('cache/',views.cache_test,name='cache'),
]