from haystack import indexes
from .models import News

class NewsIndex(indexes.SearchIndex,indexes.Indexable):
    # 名字最好叫test，如果叫其它名字，还要去settings.py中配置一下
    text = indexes.CharField(document=True,use_template=True)

    # 建的索引是给哪个模型服务的(这里是给News模型服务)
    def get_model(self):
        return News

    # 表示从News中提取数据后，返回什么值，
    def index_queryset(self, using=None):
        return self.get_model().objects.all()