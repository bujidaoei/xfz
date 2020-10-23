function News() {
    this.progressGroup = $("#progress-group");
}

// Ueditor富文本编辑器
News.prototype.initUEditor = function () {
    // 下面这行代码中的editor是在write_news.html中的id="editor"
    // 由于ue后面还要用到，如当点击发布新闻按钮后，要获取编辑器里的内容，
    // 这里将ue绑定到window上(相当于定义一个全局的变量)
    window.ue = UE.getEditor('editor',{
        // 设置文本编辑区域高度
        'initialFrameHeight': 400,
        // 这个url必须配置，否则上传图片和视频的功能就不能使用
        // 主urls.py中ueditor/和ueditor/urls.py中的upload/做拼接
        'serverUrl': '/ueditor/upload/'
    });
};
// 监听上传图片按钮点击事件（用七牛listenQiniuUploadFileEvent，这个方法已经在run函数中注释掉了）
News.prototype.listenUploadFielEvent = function () {
    // 获取上传图片按钮（返回的不是单一的对象，而是所有满足条件的集合）
    var uploadBtn = $('#thumbnail-btn');
    // 注意：点击上传图片按钮然后弹出的文件选择框是浏览器自动帮我们完成的，我们不用管，
    // 我们要去监听的事件是比如我们选中一张图片时，然后点击文件选择框的打开，这时候要去做的事情(change事件)
    uploadBtn.change(function () {
        // 取出我们打开的图片文件
        // 由于thumbnail-btn这个按钮在整个网页中只有一个(所以是uploadBtn[0](集合中的第0个))
        // files[0]表示取第一个文件(其实可以上床多个文件的)
        var file = uploadBtn[0].files[0];
        // 将图片文件发送给服务器
        // 但是不能直接发送，而是要先将图片文件存储到FormData中
        var formData = new FormData();
        // 解释下‘file’，它要与cms/views.py中upload_file上传图片视图函数中
        // file = request.FILES.get('file')中的file保持一致
        formData.append('file',file);
        // 通过ajaxqq发送给服务器
        xfzajax.post({
            'url': '/cms/upload_file/',
            'data': formData,
            // 如果不指定下面两个字段，文件会上传不成功，
            // processData：false是告诉jquery说我这个文件不需要再进行处理(因为是文件，而不是普通的文本字符串)
            // contentType': 告诉jquery让它默认使用文件形式就行了
            'processData': false,
            'contentType': false,
            'success': function (result) {
                if(result['code'] === 200){
                    // 上传成功后，服务器应该要返回图片的链接给你，而链接就在data中
                    // (result中有3个参数，code(请求状态码),message（请求正确或错误的消息）,和data(存储真正上传的数据))
                    // 读取data中的url字段
                    var url = result['data']['url'];
                    // 拿到url后，要把url放到输入框中，
                    // 那先获取输入框
                    var thumbnailInput = $("#thumbnail-form");
                    // 将url显示到输入框中
                    thumbnailInput.val(url);
                }
            }
        });
    });
};

News.prototype.listenQiniuUploadFileEvent = function () {
    var self = this;
    // 先获取上传图片按钮
    var uploadBtn = $('#thumbnail-btn');
    // 监听change方法
    uploadBtn.change(function () {
        // 相当于listenUploadFielEvent函数中的var file = uploadBtn[0].files[0];
        var file = this.files[0];
        // 如果你要与七牛云数据库交互，前提是你要有这个token(如果没有token就意味着access_key和secret_key都没有)
        // access_key和secret_key是决定了你有没有权限上传图片到这个账号下，所以要先获取token(通过ajks请求)
        xfzajax.get({
            'url': '/cms/qntoken/',
            'success': function (result) {
                if(result['code'] === 200){
                    var token = result['data']['token'];
                    // a.b.jpg = ['a','b','jpg']，以点分割会得到jpg，(new Date()).getTime()是获取当前时间戳(如198888888)
                    // 198888888 + . + jpg = 1988888.jpg，1988888.jpg即组成一个文件名
                    var key = (new Date()).getTime() + '.' + file.name.split('.')[1];
                    var putExtra = {
                        fname: key,
                        params:{},
                        // 限制上传文件类型，(这里可以上传图片和视频)
                        mimeType: ['image/png','image/jpeg','image/gif','video/x-ms-wmv']
                    };
                    // 配置信息
                    var config = {
                        useCdnDomain: true, // 是否使用cdn加速
                        //重复次数(这里假如网不好的话，总共发送6次请求)
                        retryCount: 6,
                        // 上传到哪一个空间当中，因为我创建的空间是华南地区，所以空间为qiniu.region.z2
                        region: qiniu.region.z2
                    };
                    // 调用七牛的upload方法把文件传过去，会返回一个对象，
                    var observable = qiniu.upload(file,key,token,putExtra,config);
                    // 再用返回的对象调用subscribe方法(发送一个上传文件的信息)
                    observable.subscribe({
                        // 比如文件在上传到10%，20%等，会去调用handleFileUploadProgress函数(即会告诉你当前文件上传了多少)
                        'next': self.handleFileUploadProgress,
                        // 在上传过程中如果出现错误，会去调用handleFileUploadError函数(并且返回一个错误消息)
                        'error': self.handleFileUploadError,
                        // 文件上传完成后会调用handleFileUploadComplete函数
                        'complete': self.handleFileUploadComplete
                    });
                }
            }
        });
    });
};

// 处理文件上传的过程
News.prototype.handleFileUploadProgress = function (response) {
    var total = response.total;
    var percent = total.percent;
    // toFixed(0)表示后面不带任何小数位
    var percentText = percent.toFixed(0)+'%';
    // 24.0909，89.000....
    var progressGroup = News.progressGroup;
    progressGroup.show();
    var progressBar = $(".progress-bar");
    progressBar.css({"width":percentText});
    progressBar.text(percentText);
};

// 处理文件上传出错
News.prototype.handleFileUploadError = function (error) {
    window.messageBox.showError(error.message);
    // 文件上传出错也隐藏进度条
    var progressGroup = $("#progress-group");
    progressGroup.hide();
    console.log(error.message);
};

// 处理文件成功上传
News.prototype.handleFileUploadComplete = function (response) {
    console.log(response);
    var progressGroup = $("#progress-group");
    // 上传完成后，隐藏进度条
    progressGroup.hide();
    // 并且要把图片url显示到输入框中
    // 先要获取域名
    var domain = 'http://qi1x7u4ik.hn-bkt.clouddn.com/';
    // 获取文件名
    var filename = response.key;
    // 然后就可以以域名+文件名组成一个url
    var url = domain + filename;
    // 并把组成的urlurl显示到输入框中
    var thumbnailInput = $("input[name='thumbnail']");
    thumbnailInput.val(url);
};

// 监听发布新闻按钮点击事件
News.prototype.listenSubmitEvent = function () {
    // 获取发布新闻按钮
    var submitBtn = $("#submit-btn");
    submitBtn.click(function (event) {
        // 首先要阻止默认行为(因为默认行为会采取传统的表单发送方式，这是不行的，
        // 因为此时文本编辑器不是一个普通的文本编辑器，而是由ueditor生成的一个文本编辑器)
        // 我只能通过js先获取编辑器里的内容，然后通过ajkx发送给服务器
        event.preventDefault();
        var btn = $(this);
        var pk = btn.attr('data-news-id');

        var title = $("input[name='title']").val();
        var category = $("select[name='category']").val();
        var desc = $("input[name='desc']").val();
        var thumbnail = $("input[name='thumbnail']").val();
        // 内容通过ue去拿
        var content = window.ue.getContent();

        var url = '';
        if(pk){
            url = '/cms/edit_news/';
        }else{
            url = '/cms/write_news/';
        }

        xfzajax.post({
            'url': url,
            'data': {
                'title': title,
                'category': category,
                'desc': desc,
                'thumbnail': thumbnail,
                'content': content,
                'pk': pk
            },
            'success': function (result) {
                if(result['code'] === 200){
                    xfzalert.alertSuccess('恭喜！新闻发表成功！',function () {
                        window.location.reload();
                    });
                }
            }
        });
    });
};

News.prototype.run = function () {
    var self = this;
    self.initUEditor();
    self.listenQiniuUploadFileEvent();
    self.listenSubmitEvent();
    // 用七牛(这个方法只是上传到本机的服务器)
    // self.listenUploadFielEvent();
};


$(function () {
    var news = new News();
    news.run();
    // 为了避免在handleFileUploadProgress函数中，每上传一点点都要去调用一下 $('#progress-group')(要从网页中提取很多次这个元素，就比较浪费性能)
    // 注意，不能放到News构造函数中，因为这样虽然绑定到News对象上去了，但是由于放到subscribe中去执行了，就改变了函数(this)的所属(即此时的this不是News对象了)
    // 那我们可以将$('#progress-group')绑定到News上(而不是News对象上)，而且要注意，必须要在$这个函数中去写(要在整个网页渲染完毕后，再找$('#progress-group')就不会有问题了)
    News.progressGroup = $('#progress-group');
});