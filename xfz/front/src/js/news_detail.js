// 发布评论


function NewsList() {

}

// 监听立即评论按钮点击事件
NewsList.prototype.listenSubmitEvent = function () {
    // 获取立即评论按钮
    var submitBtn = $('.submit-btn');
    //获取评论内容(这里把获取评论内容放到click函数外面来写，否则每次点击按钮时都会寻找textarea就很浪费性能)
    var textarea = $("textarea[name='comment']");
    // 给按钮绑定点击事件
    submitBtn.click(function () {
        // 获取评论内容和新闻id
        var content = textarea.val();
        // 但是html中没有哪里存放了新闻id,所以为了js写代码更方便，把新闻id绑定到评论按钮上
        // <button class="submit-btn" data-news-id="{{ news.pk }}">立即评论</button>
        var news_id = submitBtn.attr('data-news-id');
        // 将评论内容和新闻id通过ajks发给服务器
        xfzajax.post({
            'url': '/news/public_comment/',
            'data':{
                'content': content,
                'news_id': news_id
            },
            'success': function (result) {
                if(result['code'] === 200){
                    var comment = result['data'];
                    // 拿到评论的data(包括评论内容，作者头像等)后，就可以通过arttemplate将评论渲染到页面
                    // (先去html中写一个li标签的模板，看news/index_detail.html第12行)
                    var tpl = template('comment-item',{"comment":comment});
                    var commentListGroup = $(".comment-list");
                    // prepend表示添加到列表的最前面
                    commentListGroup.prepend(tpl);
                    //弹出评论发表成功的提示框
                    window.messageBox.showSuccess('评论发表成功！');
                    // 清除评论输入框中的内容
                    textarea.val("");
                }else{
                    // 如果没有登录，点击立即评论按钮后，会弹出一个请先登录的提示框(这个message是xfzauth/decorators.py里的message)
                    window.messageBox.showError(result['message']);
                }
            }
        });
    });
};

NewsList.prototype.run = function () {
    this.listenSubmitEvent();
};


$(function () {
    var newsList = new NewsList();
    newsList.run();
});