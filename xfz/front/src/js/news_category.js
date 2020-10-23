/**
 * Created by hynev on 2018/7/2.
 */

function NewsCategory() {

};

NewsCategory.prototype.run = function () {
    var self = this;
    self.listenAddCategoryEvent();
    self.listenEditCategoryEvent();
    self.listenDeleteCategoryEvent();
};
// 监听添加分类按钮点击事件
NewsCategory.prototype.listenAddCategoryEvent = function () {
    // 先要获取添加分类按钮
    var addBtn = $('#add-btn');
    // 再给按钮绑定点击事件
    addBtn.click(function () {
        // 弹出我们自己封装的模态对话框(这里是带有一个输入框的模态对话框)
        xfzalert.alertOneInput({
            'title': '添加新闻分类',
            'placeholder': '请输入新闻分类',
            // 输入分类完成后，点击对话框的确认按钮后要做的事情(这里是把分类提交给服务器保存下来)
            // inpuValue是在对话框中输入的内容
            'confirmCallback': function (inputValue) {
                // 通过ajax把输入框内容提交给服务器
                xfzajax.post({
                    // 注意，url中前面这个斜杠一定不能少，后面这个斜杠看你在app中urls.py怎么定义的
                    // (如果url.py中url后面有斜杠，那这里也要加，反之亦然)
                    'url': '/cms/add_news_category/',
                    // 这里data只需要传一个分类名字过去，名字就是inputValue
                    'data': {
                        'name': inputValue
                    },
                    'success': function (result) {
                        if(result['code'] === 200){
                            window.location.reload();
                        }else{
                            // 如果code不等于200，把模态对话框隐藏掉，并展示错误消息
                            // (zfzajax.js中已经封装了不等于200的错误消息展示，所以这里只需要close模态对话框即可)
                            xfzalert.close();
                        }
                    }
                });
            }
        });
    });
};

// 监听编辑钮点击事件
NewsCategory.prototype.listenEditCategoryEvent = function () {
    var self = this;
    // 获取所有编辑按钮
    var editBtn = $(".edit-btn");
    // 给编辑按钮绑定点击事件
    editBtn.click(function () {
        var currentBtn = $(this);
        // 点击编辑按钮后，要获取这个编辑按钮所对应哪一行(分类名称和pk)，但是不太好获取
        // (因为新闻分类名称在第一个td标签下,所以要先拿到父级元素td，然后拿到它的第一个兄弟元素，比较麻烦)
        // 那这里就可以所有的分类数据(名称和pk)定到tr标签上,这样我们想用获取这个标签对应的分类，
        // 只需要找到按钮的父级的父级元素tr标签,然后从tr标签获取名称和pk即可
        // 拿到当前编辑按钮的父级的父级元素tr标签
        var tr = currentBtn.parent().parent();
        // 拿到当前编辑按钮的主键
        var pk = tr.attr('data-pk');
        // 获取当前编辑按钮所对应的分类名称（如经济类）
        var name = tr.attr('data-name');
        xfzalert.alertOneInput({
            'title': '修改分类名称',
            'placeholder': '请输入新的分类名称',
            'value': name,  // 旧新闻分类名称显示到模态对话框的输入框中
            // 点击确认按钮发送ajax请求把数据发给服务器
            'confirmCallback': function (inputValue) {
                xfzajax.post({
                    'url': '/cms/edit_news_category/',
                    // 前端需要知道编辑的分类的pk和name值，所以data要传pk和name
                    'data': {
                        'pk': pk,
                        'name': inputValue
                    },
                    'success': function (result) {
                        if(result['code'] === 200){
                            window.location.reload();
                        }else{
                            // 如果code不等于200，把模态对话框隐藏掉，并展示错误消息
                            // (zfzajax.js中已经封装了不等于200的错误消息展示，所以这里只需要close模态对话框即可)
                            xfzalert.close();
                        }
                    }
                });
            }
        });
    });
};

// 监听删除钮点击事件
NewsCategory.prototype.listenDeleteCategoryEvent = function () {
    // 获取所有删除按钮
    var deleteBtn = $(".delete-btn");
    // 给删除按钮绑定点击事件
    deleteBtn.click(function () {
        var currentBtn = $(this);
        var tr = currentBtn.parent().parent();
        var pk = tr.attr('data-pk');
        // 点击删除按钮后，弹出一个确认删除的模态对话框
        xfzalert.alertConfirm({
            'title': '您确定要删除这个分类吗？',
            'confirmCallback': function () {
                xfzajax.post({
                    'url': '/cms/delete_news_category/',
                    // 前端只需要知道要删除的分类的ok,所以data把pk传过去
                    'data': {
                        'pk': pk
                    },
                    'success': function (result) {
                        if(result['code'] === 200){
                            window.location.reload();
                        }else{
                            // 如果code不等于200，把模态对话框隐藏掉，并展示错误消息
                            // (zfzajax.js中已经封装了不等于200的错误消息展示，所以这里只需要close模态对话框即可)
                            xfzalert.close();
                        }
                    }
                });
            }
        });
    });
};


$(function () {
    var category = new NewsCategory();
    category.run();
});