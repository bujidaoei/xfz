from django import forms
from apps.forms import FormMixin
from django.core.cache import cache
from .models import User

# 登录表单
# 这里继承了FormMixin这个提取错误信息的类，这样就可以拥有FormMixin类里的get_errors方法
class LoginForm(forms.Form,FormMixin):
    # 登录的时候需要传入3个字段
    telephone = forms.CharField(max_length=11,min_length=11,error_messages={"max_length":"请输入正确的手机号！","min_length":"请输入正确的手机号！"})
    password = forms.CharField(max_length=20,min_length=6,error_messages={"max_length":"密码最多不能超过20个字符！","min_length":"密码最少不能少于6个字符！"})
    # 是否需要记住
    # required=False表示这个字段可以不传（就是浏览器已关闭后，这个session就过期）
    remember = forms.IntegerField(required=False)
# 注册表单
class RegisterForm(forms.Form,FormMixin):
    telephone = forms.CharField(max_length=11,min_length=11,error_messages={"max_length":"请输入正确的手机号！","min_length":"请输入正确的手机号！"})
    username = forms.CharField(max_length=20)
    password1 = forms.CharField(max_length=20, min_length=6,
                               error_messages={"max_length": "密码最多不能超过20个字符！", "min_length": "密码最少不能少于6个字符！"})
    password2 = forms.CharField(max_length=20, min_length=6,
                                error_messages={"max_length": "密码最多不能超过20个字符！", "min_length": "密码最少不能少于6个字符！"})
    img_captcha = forms.CharField(min_length=4,max_length=4)
    sms_captcha = forms.CharField(min_length=4,max_length=4)
    # 因为表单验证主要是对提交的数据验证是否合法，这里比如password1和password2是否相等，img_captcha和sms_captcha是否在缓存中已经存在，所以要重写clean方法
    # clean()方法主要用于验证相互依赖的字段，例如注册时，填写的“密码”和“确认密码”要相等时才符合要求。
    # 在调用表单clean()方法的时候，所有字段的验证方法已经执行完（表单字段的默认验证（如CharField()）和特定字段属性的验证（clean_ < fieldname >）），所以self.cleaned_data
    # 填充的是目前为止已经合法的数据。所以你需要记住这个事实，你需要验证的字段可能没有通过初试的字段检查。（例如你要验证“密码”和“确认密码”是否相等，但或许它们没有通过初始字段检查，例如格式错误等，但仍会执行这一步）
    # 在这一步，有两种方法报告错误。你可以在clean()方法中抛出ValidationError来创建错误
    def clean(self):
        # 首先调用一下父类的clean方法，父类clean方法会返回一个cleandata(清理过后的数据，即上面这些条件都满足后(如手机号为11位)才会返回cleandata，否则会抛出异常)
        cleaned_data = super(RegisterForm, self).clean()
        # 验证成功后，就可以去cleaned_data中取到这些数据
        password1 = cleaned_data.get('password1')
        password2 = cleaned_data.get('password2')

        if password1 != password2:
            raise forms.ValidationError('两次密码输入不一致！')
        # 图形验证码验证(验证图形验证码之前是否在缓存中已经存在且验证缓存中的和cleaned_data中的验证码是否相同)
        # 从cleaned_data取img_captcha
        img_captcha = cleaned_data.get('img_captcha')
        # 从缓存中取img_captcha.lower()(，说明验证码在缓存中已经存在)
        cached_img_captcha = cache.get(img_captcha.lower())
        # 如果缓存中没有img_captcha或者从缓存中取到的和从cleaned_data的不一致
        if not cached_img_captcha or cached_img_captcha.lower() != img_captcha.lower():
            raise forms.ValidationError("图形验证码错误！")

        # 短信验证码验证(验证短信验证码是否在缓存中已经存在且验证缓存中的和cleaned_data中的验证码是否相同)
        # 因为缓存中的短信验证码的key是手机号，所以要先拿到手机号
        telephone = cleaned_data.get('telephone')
        # 从cleaned_data取短信验证码
        sms_captcha = cleaned_data.get('sms_captcha')
        # 从缓存中根据手机号这个key取短信验证码
        cached_sms_captcha = cache.get(telephone)
        # 如果缓存中没有短信验证码或者从缓存中取到的和从cleaned_data取到的不一致
        if not cached_sms_captcha or cached_sms_captcha.lower() != sms_captcha.lower():
            raise forms.ValidationError('短信验证码错误！')

        # 判断当前手机号是否已经被注册
        exists = User.objects.filter(telephone=telephone).exists()
        if exists:
            forms.ValidationError('该手机号码已经被注册！')

        return cleaned_data