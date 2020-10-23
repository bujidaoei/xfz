// 添加轮播图

function Banners() {

}

// 加载数据库中已经存在的轮播图
Banners.prototype.loadData = function () {
    var self = this;
    xfzajax.get({
        'url': '/cms/banner_list/',
        'success': function (result) {
            if(result['code'] === 200){
                var banners = result['data'];
                console.log(banners);
                for(var i=0; i<banners.length;i++){
                    var banner = banners[i];
                    self.createBannerItem(banner);
                }
            }
        }
    });
};

Banners.prototype.createBannerItem = function (banner) {
    var self = this;
    var tpl = template("banner-item",{"banner":banner});
    var bannerListGroup = $(".banner-list-group");

    var bannerItem = null;
    if(banner){
        bannerListGroup.append(tpl);
        bannerItem = bannerListGroup.find(".banner-item:last");
    }else{
        bannerListGroup.prepend(tpl);
        bannerItem = bannerListGroup.find(".banner-item:first");
    }
    self.addImageSelectEvent(bannerItem);
    self.addRemoveBannerEvent(bannerItem);
    self.addSaveBannerEvent(bannerItem);
};

// 监听添加轮播图按钮点击事件
Banners.prototype.listenAddBannerEvent = function () {
    var self = this;
    var addBtn = $("#add-banner-btn");
    addBtn.click(function () {
        var bannerListGroup = $('.banner-list-group');
        var length = bannerListGroup.children().length;
        if(length >= 6){
            window.messageBox.showInfo('最多只能添加6张轮播图！');
            return;
        }
        self.createBannerItem();
    });
};

// 点击“点击更换轮播图”弹出文件选择框
Banners.prototype.addImageSelectEvent = function (bannerItem) {
    var image = bannerItem.find('.thumbnail');
    var imageInput = bannerItem.find('.image-input');
    // 图片是不能够打开文件选择框的，只能通过input[type='file']
    // 所以我们为了看起来好像点击图片就打开文件选择器，在image.click里面执行input标签的click事件即可
    image.click(function () {
        imageInput.click();
    });
    // 选中图片后，点击文件选择框中的打开要做的事(执行的是change事件)
    imageInput.change(function () {
        // 获取当前选择的文件
        var file = this.files[0];
        // 下面是将图片上传到本地的服务器(其实写成上传到七牛云更好)
        var formData = new FormData();
        // 上传文件的接口是file(cms/views.py的upload_file方法中:file = request.FILES.get('file'))
        formData.append("file",file);
        // 表单构建好后，就通过ajax请求把文件发送过去
        xfzajax.post({
            'url': '/cms/upload_file/',
            'data': formData,
            'processData': false,
            'contentType': false,
            'success': function (result) {
                if(result['code'] === 200){
                    var url = result['data']['url'];
                    image.attr('src',url);
                }
            }
        });
    });
};

// 监听叉号点击事件
Banners.prototype.addRemoveBannerEvent = function (bannerItem) {
    var closeBtn = bannerItem.find('.close-btn');

    closeBtn.click(function () {
        var bannerId = bannerItem.attr('data-banner-id');
        if(bannerId){
            xfzalert.alertConfirm({
                'text': '您确定要删除这个轮播图吗?',
                'confirmCallback': function () {
                    xfzajax.post({
                        'url': '/cms/delete_banner/',
                        'data': {
                            'banner_id': bannerId
                        },
                        'success': function (result) {
                            if(result['code'] === 200){
                                bannerItem.remove();
                                window.messageBox.showSuccess('轮播图删除才成功！');
                            }
                        }
                    });
                }
            });
        }else{
            bannerItem.remove();
        }
    });
};

// 监听保存按钮点击事件
Banners.prototype.addSaveBannerEvent = function (bannerItem) {
    var saveBtn = bannerItem.find('.save-btn');
    var imageTag = bannerItem.find(".thumbnail");
    var priorityTag = bannerItem.find("input[name='priority']");
    var linktoTag = bannerItem.find("input[name='link_to']");
    var prioritySpan = bannerItem.find('span[class="priority"]');
    var bannerId = bannerItem.attr("data-banner-id");
    var url = '';
    if(bannerId){
        url = '/cms/edit_banner/';
    }else{
        url = '/cms/add_banner/';
    }
    saveBtn.click(function () {
        var image_url = imageTag.attr('src');
        var priority = priorityTag.val();
        var link_to = linktoTag.val();
        xfzajax.post({
            'url': url,
            'data':{
                'image_url': image_url,
                'priority': priority,
                'link_to': link_to,
                'pk': bannerId
            },
            'success': function (result) {
                if(result['code'] === 200){
                    if(bannerId){
                        window.messageBox.showSuccess('轮播图修改成功！');
                    }else{
                        bannerId = result['data']['banner_id'];
                        bannerItem.attr('data-banner-id',bannerId);
                        window.messageBox.showSuccess('轮播图添加完成！');
                    }
                    prioritySpan.text("优先级："+priority);
                }
            }
        });
    });
};

Banners.prototype.run = function () {
    this.listenAddBannerEvent();
    this.loadData();
};

$(function () {
    var banners = new Banners();
    banners.run();
});