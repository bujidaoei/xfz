# authenticate：授权
from django.contrib.auth import login,logout,authenticate
from django.views.decorators.http import require_POST
from .forms import LoginForm,RegisterForm
from django.http import JsonResponse,HttpResponse
from utils import restful
from django.shortcuts import redirect,reverse
from utils.captcha.xfzcaptcha import Captcha
from io import BytesIO
from utils.aliyunsdk import aliyunsms
from django.core.cache import cache
# get_user_model方法会读取settings.py中的AUTH_USER_MODEL中的xfzauth.User
from django.contrib.auth import get_user_model
# 执行get_user_model方法获取user对象，那下面在注册方法中就可以用user对象来创建user模型且保存到数据库中
User = get_user_model()

# 登录
# 处理post请求
@require_POST
# 注意，不能取名为login(因为我们导入了login模块，名字不能重复)
# 由于这个登录视图函数是走ajax请求，因此里面的内容跟模板没有任何关系
# 像登录界面这种模板，其实是浏览器本地来进行加载(即浏览器本地通过js来把登录界面显示出来或隐藏掉)
# 所以，在登录函数里面要做的事情只不过接收post过来的json然后进行验证，如果验证通过了再返回数据告诉前端登录成功了，否则就返回错误信息给前端
# 所以，这个视图函数要做的事情就是去处理前端的post请求，所以就可以把post请求的装饰器拿过来用(@require_POST表示这个视图函数只能采用post方式来提交)
def login_view(request):
    # 在这个视图函数写第一行代码时发现，拿到request后，要把里面的数据拿出来，而拿出数据后首先就要对数据进行验证，
    # 因此新建一个form.py(里面写一个登录表单)
    form = LoginForm(request.POST)
    # 如果表单验证成功，
    if form.is_valid():
        # 再把表单里的数据(字段)拿出来
        telephone = form.cleaned_data.get('telephone')
        password = form.cleaned_data.get('password')
        remember = form.cleaned_data.get('remember')
        # 进行验证（调用authenticate函数）
        # authenticate方法，认证一组给定的用户名和密码，它接受关键字参数的凭证，使用默认配置时参数是username和password，
        # 如果密码能够匹配给定的用户名，它将返回一个User对象。如果密码无效，将会返回None
        user = authenticate(request, username=telephone, password=password)
        # 如果验证成功，authenticate就会返回一个user对象
        if user:
            # 先验证这个账户能不能使用
            if user.is_active:
                # 如果可以使用就调用login函数进行登录
                login(request, user)
                # 看看用户有没有选择记住我
                if remember:
                    # 如果选择了，就将session的时间延长为默认的两个礼拜时间
                    request.session.set_expiry(None)
                else:
                    # 如果没有选择，当浏览器关闭后，这个session就过期(即再次打开浏览器进入到xfz后要重新登录)
                    request.session.set_expiry(0)
                # 因为登录界面是一个模态对话框，所以一个走ajax请求，因此登录的视图函数应该使用json进行交互(把django内置的JsonResponse拿过来).
                # 那返回什么？根据公司如果涉及api而定，后台要先把返回的格式设计好，一般我是这样去设计的：
                # 首先要返回一个code码，来告诉当前请求是正常的还是错误的（还要说明一点，这个code是我们前端和后端人员协商好这么去设计的，是自己去写的，跟http状态码没有关系）
                # 然后是meaaage，比如code为200时，可以让message为空，而当code为如400时，message就是错误信息，然后就可以通过message将错误信息传递给前端
                # 然后是data，data值可以为字典和列表，比如我们要返回用户的一些个人信息，就可以通过data值来返回，如data:{"username":"xiaoyu","age":18}
                # {"code":400,"message":"","data":{}}
                return restful.ok()
            else:
                return restful.unauth(message="您的账号已经被冻结了！")
        else:
            # 验证失败
            return restful.params_error(message="手机或者密码错误！")
    else:
        # 表单验证失败，那就要把表单验证的错误信息返回给前端，由于表单验证失败的错误信息比较多，那我们就可以进行提取，如下所示
        # {"password":['密码最大长度不能超过20为！','xxx'],"telephone":['xx','x']}
        errors = form.get_errors()
        return restful.params_error(message=errors)

# 退出登录
def logout_view(request):
    logout(request)
    # 退出登录后，重定向到首页
    return redirect(reverse('index'))

# 注册
@require_POST
def register(request):
    # 首先要进行表单验证
    form = RegisterForm(request.POST)
    # 如果表单验证成功，就把数据提取出来
    if form.is_valid():
        telephone = form.cleaned_data.get('telephone')
        username = form.cleaned_data.get('username')
        # 在表单验证中已经验证了password1和password2相等，所以这里取一个就行
        password = form.cleaned_data.get('password1')
        # 创建用户，并将用户信息保存到数据库中，即相当于注册完成了
        user = User.objects.create_user(telephone=telephone,username=username,password=password)
        # 为了用户更好的体验，一旦注册好了就立马处于登录状态（感觉一般还是要先手动登录的）
        login(request,user)
        # 告诉前端登录成功
        return restful.ok()
    else:
        # print(form.get_errors())
        return restful.params_error(message=form.get_errors())

# 生成验证码
def img_captcha(request):
    # 获取生成的验证码和图片
    text,image = Captcha.gene_code()
    # image对象并不能直接放在HttpResponse中返回，得放到流(要借助I/O的对象)当中进行返回
    # BytesIO：相当于一个管道，用来存储图片的流数据
    out = BytesIO()
    # 调用save方法，将这个image保存到BytesIO对象中(且图片类型为png)
    image.save(out,'png')
    # 此时out就在文件指针的最后一个位置了
    # 将BytesIO的文件指针移动到最开始的位置
    out.seek(0)
    # HttpResponse默认是存储字符串，这里指定HttpResponse存储的类型是png的图片
    response = HttpResponse(content_type='image/png')
    # 从BytesIO的管道中，读取出图片数据，保存到response对象上
    # 因为这里要out.read()，这也是为什么前面把文件指针移动到最开始的位置
    response.write(out.read())
    # 文件指针从开头移到最后，此时out.tell()就可以代表文件的大小
    response['Content-length'] = out.tell()
    # 将图形验证码存储到缓存中（memchched）
    # 比如验证码为12Df，那就将12Df.lower()存储到memchched中(为了用户体验，不区分大小写)
    # 以字典方式存储，字典的key和value都是text.lower()，并且设置过期时间为5分钟
    cache.set(text.lower(),text.lower(),5*60)
    return response

# 短信验证码
def sms_captcha(request):
    # /sms_captcha/?telephone=xxx
    # 先获取短信发送到的手机号码
    telephone = request.GET.get('telephone')
    # 获取一个随机的验证码
    code = Captcha.gene_text()
    # 将短信验证码存储到memcached中，手机号为key,验证码为value，有效期也设置为5分钟
    cache.set(telephone,code,5*60)
    # 运用到生产环境要用下面这行代码来真正的发送短信验证
    # result = aliyunsms.send_sms(telephone,code)
    # 测试用
    # 写代码测试阶段如果每次测试注册功能都去发送短信验证就比较浪费钱，所以这里采用在控制台打印验证码的方式
    print('短信验证码：', code)
    return restful.ok()

# 测试能不能存储到memchche中(只是测试而已，与web)
def cache_test(request):
    cache.set('username','xiaoyu',60)
    result = cache.get('username')
    print(result)
    return HttpResponse('success')