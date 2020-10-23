#encoding: utf-8
from utils import restful
from django.shortcuts import redirect

# 装饰器
def xfz_login_required(func):
    def wrapper(request,*args,**kwargs):
        if request.user.is_authenticated:
            # 如果已经登录了，那就执行func这个视图函数,并且将值返回回去
            return func(request,*args,**kwargs)
        else:
            # 如果没有登录，就把这个请求拦截在func这个视图函数外面
            # 如果是ajkx请求，就返回一个没有登录的错误
            if request.is_ajax():
                return restful.unauth(message='请先登录！')
            else:
                # 如果是一个普通的验证跳转的话，就让它做一个重定向(这里重定向到首页)
                return redirect('/')
    return wrapper