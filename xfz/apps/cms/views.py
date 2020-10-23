from django.shortcuts import render
from django.contrib.admin.views.decorators import staff_member_required
from django.views.generic import View
from django.views.decorators.http import require_POST,require_GET
from apps.news.models import NewsCategory,News,Banner
from utils import restful
from .form import EditNewsCategoryForm,WriteNewsForm,AddBannerForm,EditBannerForm,EditNewsForm
import os
from django.conf import settings
import qiniu
from django.conf import settings
from apps.news.serializers import BannerSerializer
from django.core.paginator import Paginator
from datetime import datetime
from django.utils.timezone import make_aware
from urllib import parse


@staff_member_required(login_url='index')
def index(request):
    return render(request,'cms/index.html')


class NewsListView(View):
    def get(self,request):
        # request.GET：获取出来的所有数据，都是字符串类型
        page = int(request.GET.get('p',1))
        start = request.GET.get('start')
        end = request.GET.get('end')
        title = request.GET.get('title')
        # request.GET.get(参数,默认值)
        # 这个默认值是只有这个参数没有传递的时候才会使用
        # 如果传递了，但是是一个空的字符串，那么也不会使用默认值
        category_id = int(request.GET.get('category',0) or 0)

        newses = News.objects.select_related('category', 'author')

        if start or end:
            if start:
                start_date = datetime.strptime(start,'%Y/%m/%d')
            else:
                start_date = datetime(year=2018,month=6,day=1)
            if end:
                end_date = datetime.strptime(end,'%Y/%m/%d')
            else:
                end_date = datetime.today()
            newses = newses.filter(pub_time__range=(make_aware(start_date),make_aware(end_date)))

        if title:
            newses = newses.filter(title__icontains=title)

        if category_id:
            newses = newses.filter(category=category_id)

        paginator = Paginator(newses, 2)
        page_obj = paginator.page(page)

        context_data = self.get_pagination_data(paginator,page_obj)

        context = {
            'categories': NewsCategory.objects.all(),
            'newses': page_obj.object_list,
            'page_obj': page_obj,
            'paginator': paginator,
            'start': start,
            'end': end,
            'title': title,
            'category_id': category_id,
            'url_query': '&'+parse.urlencode({
                'start': start or '',
                'end': end or '',
                'title': title or '',
                'category': category_id or ''
            })
        }

        print('='*30)
        print(category_id)
        print('='*30)

        context.update(context_data)

        return render(request, 'cms/news_list.html', context=context)


    def get_pagination_data(self,paginator,page_obj,around_count=2):
        current_page = page_obj.number
        num_pages = paginator.num_pages

        left_has_more = False
        right_has_more = False

        if current_page <= around_count + 2:
            left_pages = range(1,current_page)
        else:
            left_has_more = True
            left_pages = range(current_page-around_count,current_page)

        if current_page >= num_pages - around_count - 1:
            right_pages = range(current_page+1,num_pages+1)
        else:
            right_has_more = True
            right_pages = range(current_page+1,current_page+around_count+1)

        return {
            # left_pages：代表的是当前这页的左边的页的页码
            'left_pages': left_pages,
            # right_pages：代表的是当前这页的右边的页的页码
            'right_pages': right_pages,
            'current_page': current_page,
            'left_has_more': left_has_more,
            'right_has_more': right_has_more,
            'num_pages': num_pages
        }

# 添加新闻
class WriteNewsView(View):
    # 要想在网页中的分类选择框显示新闻分类，要将数据库中的新闻分类传给它，然后再模板(html)中进行显示即可
    # 这个是通过get请求获取
    def get(self,request):
        categories = NewsCategory.objects.all()
        context = {
            'categories': categories
        }
        return render(request,'cms/write_news.html',context=context)
    # 那下面当点击发布新闻按钮后，要把网页中(所有输入框)中的内容提交给服务器
    # 这个是通过post请求发送
    # 首选肯定要定义一个表单，用来验证里面的数据是否符合要求，如果表单验证通过，就要将数据保存到数据库中
    # (要保存到数据库中首先得要一张news的表，所以去news/model.py中写一个News模型)
    def post(self,request):
        form = WriteNewsForm(request.POST)
        # 如果表单验证成功，就从表单中把数据提取出来
        if form.is_valid():
            title = form.cleaned_data.get('title')
            desc = form.cleaned_data.get('desc')
            thumbnail = form.cleaned_data.get('thumbnail')
            content = form.cleaned_data.get('content')
            category_id = form.cleaned_data.get('category')
            # 有了category_id后，就可以去NewsCategory模型中把真正的category拿出来
            category = NewsCategory.objects.get(pk=category_id)
            # 将数据插入到数据库中
            News.objects.create(title=title,desc=desc,thumbnail=thumbnail,content=content,category=category,author=request.user)
            return restful.ok()
        else:
            return restful.params_error(message=form.get_errors())

# 编辑新闻
class EditNewsView(View):
    def get(self,request):
        news_id = request.GET.get('news_id')
        news = News.objects.get(pk=news_id)
        context = {
            'news': news,
            'categories': NewsCategory.objects.all()
        }
        return render(request,'cms/write_news.html',context=context)

    def post(self,request):
        form = EditNewsForm(request.POST)
        if form.is_valid():
            title = form.cleaned_data.get('title')
            desc = form.cleaned_data.get('desc')
            thumbnail = form.cleaned_data.get('thumbnail')
            content = form.cleaned_data.get('content')
            category_id = form.cleaned_data.get('category')
            pk = form.cleaned_data.get("pk")
            category = NewsCategory.objects.get(pk=category_id)
            News.objects.filter(pk=pk).update(title=title,desc=desc,thumbnail=thumbnail,content=content,category=category)
            return restful.ok()
        else:
            return restful.params_error(message=form.get_errors())

# 删除新闻
@require_POST
def delete_news(request):
    news_id = request.POST.get('news_id')
    News.objects.filter(pk=news_id).delete()
    return restful.ok()

# 新闻分类
@require_GET
def news_category(request):
    # 要想在网页中显示新闻分类，要将数据库中的新闻分类传给网页，然后再模板(html)中进行显示即可
    # 一般新闻分类不会很多，因此我们可以将新闻分类从数据库中全部提取出来再返回回去
    categories = NewsCategory.objects.all()
    # django中，要先把数据抱在一个字典中
    context = {
        'categories': categories
    }
    return render(request,'cms/news_category.html',context=context)

# 添加新闻分类
# 由于添加新闻分类只能采用post请求，所以@一个post请求的装饰器
@require_POST
def add_news_category(request):
    # 添加新闻分类在前端只需要传递一个分类名字过来即可，这里就不去写form表单了(因为写form表单也只是写一个charfiled)
    name = request.POST.get('name')
    # 拿到前端传过来的分类名字后，先判断一下这个分类名字在数据库中是否存在
    exists = NewsCategory.objects.filter(name=name).exists()
    if not exists:
        # 如果不存在就将这个分类保存到数据库中
        NewsCategory.objects.create(name=name)
        return restful.ok()
    else:
        return restful.params_error(message='该分类已经存在！')

# 编辑新闻分类
@require_POST
def edit_news_category(request):
    # 要编辑新闻分类，你肯定要先告诉编辑哪个新闻分类(即告诉分类的主键)，
    # 还要告诉你编辑后的分类叫什么，所以要传两个参数，这里采用表单验证
    form = EditNewsCategoryForm(request.POST)
    # 如果表单验证成功，就把里面的数据(分类主键和名字)取出来
    if form.is_valid():
        pk = form.cleaned_data.get('pk')
        name = form.cleaned_data.get('name')
        try:
            # 这里一步到位，先把数据库中pk=pk的分类过滤出来，然后调用update方法(会更新name值)
            # 因为可能数据库中不存在这个pk，所以用try...except来捕获这个异常
            NewsCategory.objects.filter(pk=pk).update(name=name)
            return restful.ok()
        except:
            return restful.params_error(message='该分类不存在！')
    else:
        return restful.params_error(message=form.get_error())

# 删除新闻分类
@require_POST
def delete_news_category(request):
    # 只需要传要删除的分类的pk即可(这里也没必要去写表单，直接从post中去取)
    pk = request.POST.get('pk')
    try:
        # 一步到位，从数据库中过滤出pk并删除
        NewsCategory.objects.filter(pk=pk).delete()
        return restful.ok()
    except:
        return restful.unauth(message='该分类不存在！')

def banners(request):
    return render(request,'cms/banners.html')

# 轮播图列表
def banner_list(request):
    banners = Banner.objects.all()
    serialize = BannerSerializer(banners,many=True)
    return restful.result(data=serialize.data)


def add_banner(request):
    form = AddBannerForm(request.POST)
    if form.is_valid():
        priority = form.cleaned_data.get('priority')
        image_url = form.cleaned_data.get('image_url')
        link_to = form.cleaned_data.get('link_to')
        banner = Banner.objects.create(priority=priority,image_url=image_url,link_to=link_to)
        return restful.result(data={"banner_id":banner.pk})
    else:
        return restful.params_error(message=form.get_errors())

def delete_banner(request):
    banner_id = request.POST.get('banner_id')
    Banner.objects.filter(pk=banner_id).delete()
    return restful.ok()


def edit_banner(request):
    form = EditBannerForm(request.POST)
    if form.is_valid():
        pk = form.cleaned_data.get('pk')
        image_url = form.cleaned_data.get('image_url')
        link_to = form.cleaned_data.get('link_to')
        priority = form.cleaned_data.get('priority')
        Banner.objects.filter(pk=pk).update(image_url=image_url,link_to=link_to,priority=priority)
        return restful.ok()
    else:
        return restful.params_error(message=form.get_errors())

# 上传文件(发布新闻里的上传图片按钮)
@require_POST
def upload_file(request):
    # 这个file可以是后端规定前端的上传文件参数必须叫file
    # 看write_news.js中listenUploadFielEvent方法中formData.append('file',file);里面的file和这里的file要保持一致
    file = request.FILES.get('file')
    # 拿到文件名字
    name = file.name
    # 然后把文件保存到服务器中(这里保存到项目下的media文件夹下)
    with open(os.path.join(settings.MEDIA_ROOT,name),'wb') as fp:
        for chunk in file.chunks():
            fp.write(chunk)
    # 要以http://127.0.1:8000/media/abc.jpg这种形式将图片url显示到输入框中
    # build_absolute_uri相当于集成了http://127.0.1:8000(当前网站的域名，那后面只要加上/media/abc.jpg即可
    # http://127.0.1:8000/media/abc.jpg
    url = request.build_absolute_uri(settings.MEDIA_URL+name)
    return restful.result(data={'url':url})


@require_GET
def qntoken(request):
    access_key = settings.QINIU_ACCESS_KEY
    secret_key = settings.QINIU_SECRET_KEY

    bucket = settings.QINIU_BUCKET_NAME
    q = qiniu.Auth(access_key,secret_key)

    token = q.upload_token(bucket)

    return restful.result(data={"token":token})