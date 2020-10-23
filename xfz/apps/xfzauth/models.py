# 1，创建一个xfzauth的app（注意：不能创建一个叫auth的app，因为auth这个app已经被django使用了），用来管理用户系统，
# 2，全部重写，继承自AbstractBaseUser，
# 3，定义UserManager，
# 4，设置AUTH_USER_MOSEL，
# 5，映射到数据库中，

# 先把user模型需要继承的两个基类导入一下
from django.contrib.auth.models import AbstractBaseUser,PermissionsMixin,BaseUserManager
from shortuuidfield import ShortUUIDField
from django.db import models

class UserManager(BaseUserManager):
    # 创建用户（其实创建普通/超级用户这两个方法最终会调用_create_user方法，只不过对外提供了创建普通/超级用户的两个接口）
    # telphone username password是必须输入的
    # 前面有下划线的方法表示这个方法是受保护的方法，是不能在外面使用的(约定俗成)
    # 其实这个方法也有去除重复代码的功能，否则里面的逻辑在create_user和create_superuser中都要写一遍
    def _create_user(self,telephone,username,password,**kwargs):
        if not telephone:
            raise ValueError('请输入手机号码')
        if not username:
            raise ValueError('请输入用户名')
        if not password:
            raise ValueError('请输入密码')

        # self.model表示下面创建的User类
        # password是不能传进去的，因为password要经过加密后才能传进去
        user = self.model(telephone=telephone,username=username,**kwargs)
        # 把密码设置进去
        user.set_password(password)
        user.save()
        return user

    # 创建普通用户
    # 由于_creat_user不能被外面使用，因此这里还要定义一个可以被外面使用的creat_user方法
    def create_user(self, telephone, username, password, **kwargs):
        kwargs['is_superuser'] = False
        return self._create_user(telephone, username, password, **kwargs)

    # 创建超级用户
    def create_superuser(self, telephone, username, password, **kwargs):
        kwargs['is_superuser'] = True
        # 如果是超级用户，那肯定也是普通用户
        kwargs['is_staff'] = True
        return self._create_user(telephone, username, password, **kwargs)

# 然后创建一个继承这两个基类的类，在里面定义字段
class User(AbstractBaseUser,PermissionsMixin):
    # 定义字段
    # 我们不使用默认的自增长主键（为什么？你想，如果现在100个注册用户，那注册id就是1-100有序排列，这样就存在很大的安全隐患，
    # 比如公司宣传说我们公司注册用户达到100万，然后，别人发现id为100的时候可以取到用户，id101,102...时都取不到用户，那就发现我们是虚假宣传，非常泄露公司机密）
    # 那我们使用什么id？uuid：它是全球唯一的一个字符串（所以可以当做主键）（但是又有一个缺点，字符串长度特别长，会影响mysql的查询性能）
    # 所以使用shortuuid：保证了唯一和长度短的特点，（要使用一个第三方包：django-shortuuidfield，通过pip install django-shortuuidfield来安装）
    uid = ShortUUIDField(primary_key=True)
    username = models.CharField(max_length=100)
    telephone = models.CharField(max_length=11,unique=True)
    # max_length=200：因为密码经过加密后长度会很长，
    # password = models.CharField(max_length=200)
    email = models.EmailField(unique=True,null=True)
    # 是否是可用的（默认可用）
    is_active = models.BooleanField(default=True)
    # 如果是员工的话，就不能登录到管理系统中（默认不是员工）
    is_staff = models.BooleanField(default=False)
    # 保存一个user模型到数据库中时，会记录当前时间
    date_joined = models.DateTimeField(auto_now_add=True)

    # 定义属性
    # 用来做验证的，如果我们没有重写User模型，那默认是使用username字段来验证(而我们这里是使用手机号码来验证)
    USERNAME_FIELD = 'telephone'
    # 终端输入creatt superuer的时候就会要你去填REQUIRED_FIELDS这个字段，我们这里给username(那系统出了提示要你填username,还会把USERNAME_FIELD字段和password进行提示让你进行输入)
    # 即会提示输入telephone，username，password这3个字段，
    REQUIRED_FIELDS = ['username']
    # 作用不是很大，给用户发送邮件
    EMAIL_FIELD = 'email'

    objects = UserManager()

    # 定义方法
    def get_full_name(self):
        return self.username
    def get_short_name(self):
        return self.username

# user模型定义好后，设置下settings.py，把这个模型映射到数据库中，就可以把这个模型放到表单中去用了