from django import forms
from apps.forms import FormMixin

# 点击发布评论时要将评论的内容和新闻的id传给数据库
class PublicCommentForm(forms.Form,FormMixin):
    content = forms.CharField()
    news_id = forms.IntegerField()