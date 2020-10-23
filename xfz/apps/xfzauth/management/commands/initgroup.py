# 创建自己的命令，这里想执行initgroup命令后，就创建一些分组
# 注意1：必须先建一个叫‘management’的包，然后再里面建一个叫‘command’的包
#  注意2：必须建一个继承BaseCommand的Command类，然后在里面的handle里面写命令的逻辑代码
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group,Permission,ContentType
from apps.news.models import News,NewsCategory,Banner,Comment
from apps.course.models import Course,CourseCategory,Teacher
from apps.payinfo.models import Payinfo
from apps.course.models import CourseOrder
from apps.payinfo.models import PayinfoOrder

class Command(BaseCommand):
    # 命令的逻辑代码
    def handle(self, *args, **options):
        # 1，编辑组（管理新闻/管理课程/管理评论/管理轮播图）
        # 先找到编辑组下所有的ContentType
        edit_content_types = [
            ContentType.objects.get_for_model(News),
            ContentType.objects.get_for_model(NewsCategory),
            ContentType.objects.get_for_model(Banner),
            ContentType.objects.get_for_model(Comment),
            ContentType.objects.get_for_model(Course),
            ContentType.objects.get_for_model(CourseCategory),
            ContentType.objects.get_for_model(Teacher),
            ContentType.objects.get_for_model(Payinfo),
        ]
        # 然后找到编辑组下所有的权限
        edit_permissions = Permission.objects.filter(content_type__in=edit_content_types)
        # 然后创建一个分组
        editGroup = Group.objects.create(name='编辑')
        # 然后把权限添加到分组中
        editGroup.permissions.set(edit_permissions)
        # 保存
        editGroup.save()
        self.stdout.write(self.style.SUCCESS('编辑分组创建完成'))
        # 2，财务组（课程订单/付费资讯订单）
        finance_content_types = [
            ContentType.objects.get_for_model(CourseOrder),
            ContentType.objects.get_for_model(PayinfoOrder),
        ]
        finance_permissions = Permission.objects.filter(content_type__in=finance_content_types)
        financeGroup = Group.objects.create(name='财务')
        financeGroup.permissions.set(finance_permissions)
        financeGroup.save()
        self.stdout.write(self.style.SUCCESS('财务分组创建完成'))
        # 3，管理员组（编辑组+财务组）（只需要将编辑组和财务组的权限合二为一即可）
        admin_permissions = edit_permissions.union(finance_permissions)
        adminGroup = Group.objects.create(name='管理员')
        adminGroup.permissions.set(admin_permissions)
        adminGroup.save()
        # 4，超级管理员
        self.stdout.write(self.style.SUCCESS('管理员分组创建完成'))

        # 然后就可以输入python manage.py initgroup创建这几个分组了