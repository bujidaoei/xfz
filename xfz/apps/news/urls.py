#encoding: utf-8
from django.urls import path
from . import views

app_name = 'news'

urlpatterns = [
    # 这里为什么要把new_id变为整型，因为如果不重要，那如cms/list也会这个url所截取，那就访问不到第2个url了
    path('<int:news_id>/',views.news_detail,name='news_detail'),
    path('list/',views.news_list,name='news_list'),
    path('public_comment/',views.public_comment,name='public_comment')
]