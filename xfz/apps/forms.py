# 由于很多地方要进行表单验证(要处理错误信息)，那就可以把表单验证出错的方法抽取出来，放到父类中，
# 那以后有表单验证的地方就可以继承这个父类，这样就可以达到代码重构的目的
class FormMixin(object):
    # 由于表单验证错误的信息太多，所以要对表单验证错误的信息进行提取
    def get_errors(self):
        if hasattr(self,'errors'):
            errors = self.errors.get_json_data()
            new_errors = {}
            for key, message_dicts in errors.items():
                messages = []
                for message in message_dicts:
                    messages.append(message['message'])
                new_errors[key] = messages
            return new_errors
        else:
            return {}