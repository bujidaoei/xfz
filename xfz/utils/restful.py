# 重构JsonResponse的返回值，
# 原先：resturn JsonResponse({"code":200,"message":"","data":{}})
# 之后：return restful.ok()
# JsonResponse的返回值在很多地方都要用到，那就要写很多重复的代码，所以这里对其进行重构

from django.http import JsonResponse

# 首先就是写跟前端协商好的状态码
class HttpCode(object):
    ok = 200
    # 参数错误（比如密码只能是6位，那多于/少于6位都是参数错误）
    paramserror = 400
    # 没有授权
    unauth = 401
    # 请求方法错误（比如视图函数采用get请求，那你采用post请求就是请求方法错误）
    methoderror = 405
    # 服务器内部错误
    servererror = 500

# 定义好状态码就可以把JsonResponse的返回值封装一下
# {"code":400,"message":"","data":{}}
def result(code=HttpCode.ok,message="",data=None,kwargs=None):
    # 先来构建一个这种样式的字典，
    json_dict = {"code":code,"message":message,"data":data}
    # 传入的kwargs我期望是字典类型，如果不是字典类型或者是空值，那就不进行处理
    # 如果kwargs存在，并且是字典类型，并且字典的key存在
    if kwargs and isinstance(kwargs,dict) and kwargs.keys():
        # 那就将kwargs字典中的值拼接到json_dict中
        json_dict.update(kwargs)
    return JsonResponse(json_dict)

# 下面进一步封装，使在视图函数中调用代码更加简洁
# 还可以对状态码进行封装：
# 之前：restful.result(code=resultful.HttpCode.unauth,message="您的账号已经被冻结了！")
# 之后： return restful.unauth(message="您的账号已经被冻结了！")
# 正常
def ok():
    return result()
# 参数错误
def params_error(message="",data=None):
    return result(code=HttpCode.paramserror,message=message,data=data)
# 没有授权
def unauth(message="",data=None):
    return result(code=HttpCode.unauth,message=message,data=data)
# 请求方法错误
def method_error(message='',data=None):
    return result(code=HttpCode.methoderror,message=message,data=data)
# 服务器内部错误
def server_error(message='',data=None):
    return result(code=HttpCode.servererror,message=message,data=data)

