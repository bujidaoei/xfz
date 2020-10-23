from django.shortcuts import render
from .models import News,NewsCategory,Banner
from django.conf import settings
from utils import restful
from .serializers import NewsSerializer,CommentSerizlizer
from django.http import Http404
from .forms import PublicCommentForm
from .models import Comment
from apps.xfzauth.decorators import xfz_login_required
from django.db.models import Q

# 新闻页面(主页)
def index(request):
    # 一次性加载多少篇文章(这里设置为2篇)
    count = settings.ONE_PAGE_NEWS_COUNT
    # 获取数据库中的新闻和新闻分类，然后就可以在html中进行显示了
    # select_related可以根据指定外键的名字将外键对应的数据也查找出来(这里category和author是外键)
    # 有什么好处？如在index.html中有{{ news.category.name }}，如果不用select_related那它要先查找category这个外键，
    # 拿到category外键后，再根据这个外键去对应表里获取name值，那就要进行2次sql查询，而如果有100篇文章，那就要多做200次sql查询
    newses = News.objects.select_related('category','author').all()[0:count]
    categories = NewsCategory.objects.all()
    context = {
        'newses': newses,
        'categories': categories,
        'banners': Banner.objects.all()
    }
    return render(request,'news/index.html',context=context)

# 点击查看更多读取更多文章的数据是js的(而不是通过模板渲染方式)
# 处理新闻列表
def news_list(request):
    # 通过p参数，来指定要获取第几页的数据
    # 并且这个p参数，是通过查询字符串的方式传过来的/news/list/?p=2
    # 如果没有url中没有给p参数，那默认返回第1页数据(且要变成整型，否则是字符串类型，那就不能做相加)
    page = int(request.GET.get('p',1))
    # 分类为0：代表不进行任何分类，直接按照时间倒序排序
    category_id = int(request.GET.get('category_id',0))
    # 点击加载更多按钮时要加载起始新闻和结束新闻
    # 0,1
    # 2,3
    # 4,5
    start = (page-1)*settings.ONE_PAGE_NEWS_COUNT
    end = start + settings.ONE_PAGE_NEWS_COUNT
    # 如果category_id为0(即没有指定分类)，就加载全部分类内容，否则只加载category_id所对应的分类内容
    if category_id == 0:
        # 这里不能通过value()来获取，它会得到一个列表，列表里面是字典，但是这个字典有很大的缺陷，
        # 比如我们想获取的新式如下(把category下所有信息获取到，1但是value()只是获取category下的id)
        # {'id':1,'title':'abc',category:{"id":1,'name':'热点'}}
        # 那这时候我们就要用到一个插件：django rest framework(如里面的序列化就可以将一个模型序列化成json形式的字符串，
        # 可以告诉它哪些字段要序列化，并且如category，不仅仅获取id还要获取其它信息(如name))
        newses = News.objects.select_related('category','author').all()[start:end]
    else:
        newses = News.objects.select_related('category','author').filter(category__id=category_id)[start:end]
    # 创建一个序列化，把newses传进去，由于newses中有很多新闻数据(queryset对象)，所以要传many=True(表示有很多新闻数据都要去序列化)
    serializer = NewsSerializer(newses,many=True)
    # 拿到序列化后就可以通过erializer.data拿到序列化里的值
    data = serializer.data
    return restful.result(data=data)

# 新闻详情页面
def news_detail(request,news_id):
    # 当get方法指定参数匹配到的值有且只有一个才会返回，否则(匹配不到数据或匹配到多条数据)就会报错
    # 所以这里我们要加上错误处理
    try:
        # prefetch_related会发生两次请求，一次是将新闻下的所有评论提取出来，第二次是将评论对应的所有author提取出来，
        # 而如果不用prefetch_related的话，每条评论都会产生一次sql请求
        news = News.objects.select_related('category','author').prefetch_related("comments__author").get(pk=news_id)
        context = {
            'news': news
        }
        return render(request,'news/news_detail.html',context=context)
    except News.DoesNotExist:
        raise Http404

# 新闻评论
# 这个装饰器是只有在登录状态下才能够评论(这个装饰器在xfzauth/decorators.py里)
@xfz_login_required
def public_comment(request):
    form = PublicCommentForm(request.POST)
    # 如果表单验证成功，将评论内容和新闻id传给数据库
    # 这里做的更好的话可以像上面news_detail一样使用try..except来判断一下新闻的news_id是否存在，如果不存在就抛出404页面
    if form.is_valid():
        news_id = form.cleaned_data.get('news_id')
        content = form.cleaned_data.get('content')
        news = News.objects.get(pk=news_id)
        # 将评论保存到数据库中
        comment = Comment.objects.create(content=content,news=news,author=request.user)
        # 我们输入评论点击理解评论按钮后，整个网页并没有重新加载(而是将评论内容通过ajax请求发送给服务器，服务器接收到数据后，立马将评论显示到评论区)
        # 所以，客户端通过ajax请求将评论数据提交给服务器后，服务器不仅仅返回一个ok，还会将评论的数据返回给浏览器，浏览器拿到评论的json数据后，就可以采用arttemplate渲染到页面中
        # 所以要把评论序列化成一个json对象(由于作者的用户名和新闻是通过外键方式引用的，要转成json不太方便，那即㐀借助序列化(告诉作者和新闻需要哪些字段，而不仅仅是返回作者和新闻的id))
        # 先去serializers.py中定义一个评论的序列化，
        # 把评论内容序列化(这里不需要像news_list中加上是many=True，因为新闻列表是一个queryset对象(有多个)，所以要加，而这里只是有一个对象)
        serizlize = CommentSerizlizer(comment)
        # 点击发布评论按钮后，不仅告诉服务器发布评论成功，而且将评论显示出来
        return restful.result(data=serizlize.data)
    else:
        return restful.params_error(message=form.get_errors())

# 搜索模块(看起来好像要单独要创建一个app，但是由于只是用于搜索新闻，所以就放到news中来写)
def search(request):
    q = request.GET.get('q')
    context = {}
    if q:
        newses = News.objects.filter(Q(title__icontains=q)|Q(content__icontains=q))
        context['newses'] = newses
    return render(request, 'search/search1.html', context=context)