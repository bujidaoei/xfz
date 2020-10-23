// 首页轮播图和新闻列表

// 首页轮播图部分
// 这个函数相当于python类中的__init__方法(只要一创建类的对象聚会执行__init__方法)，这里只要一new Banner()就会执行这个函数
function Banner() {
    // 通过this来添加属性
    this.bannerWidth = 798;
    // 获取轮播窗口
    this.bannerGroup = $("#banner-group");
    // 要保存当前处于第几张图片，否则鼠标移进移出时，又会从第0张图片开始轮播，而我们希望的是从当前图片开始往后轮播
    // 设置默认index为1，解决第一次轮播第一张图片时间占两个轮播时长的问题
    this.index = 1;
    // 避免每次鼠标移进移出都要去html文档寻找left/right-arrow(因为这样效率很低)，所以可以把左右两个箭头保存在对象上面(这样总共取一次即可)
    this.leftArrow = $(".left-arrow");
    this.rightArrow = $(".right-arrow");
    // 获取li标签的个数(下面3行代码)
    this.bannerUl = $("#banner-ul");
    // 得到一个列表
    this.liList = this.bannerUl.children("li");
    this.bannerCount = this.liList.length;
    this.pageControl = $(".page-control");
}

// 通过prototype添加方法
// 定义轮播图片的宽度(有几张轮播图就要有几张图片的宽度，而不应该写死)
Banner.prototype.initBanner = function () {
    var self = this;
    // 实现循环轮播（视觉上是由最后一张向后滚动到第一张而不是由最后一张滚动向前滚动到第一张）
    // 实现原理是在第一张图片前复制最后一张图片，在最后一张图片后复制第一张图片
    var firstBanner = self.liList.eq(0).clone();
    var lastBanner = self.liList.eq(self.bannerCount-1).clone();
    // 在最后面添加第一张图片
    self.bannerUl.append(firstBanner);
    // 在最前面添加最后一张图片
    self.bannerUl.prepend(lastBanner);
    // 修改添加2张图片后的宽度，并且默认宽度是-self.bannerWidth(否则默认显示最后一张图片)
    this.bannerUl.css({"width":self.bannerWidth*(self.bannerCount+2),'left':-self.bannerWidth});
};

// 初始化小圆点(个数)
Banner.prototype.initPageControl = function () {
    var self = this;
    for (var  i=0; i<self.bannerCount; i++) {
        // 创建li标签
        var circle = $("<li></li>");
        // 将创建的li标签添加到pageControl(ul标签)中
        self.pageControl.append(circle);
        // 默认第0个为选中状态
        if(i === 0) {
            // 给li标签添加class属性
            circle.addClass("active")
        }
    }
    // 动态设置page-control这个盒子的宽度
    self.pageControl.css({width: self.bannerCount*12+ 8*2 + 16*(self.bannerCount-1)});
};

// 左右箭头是否显示
Banner.prototype.toggleArrow = function (isShow) {
    var self = this;
    if(isShow) {
        self.leftArrow.show();
        self.rightArrow.show();
    }else {
        self.leftArrow.hide();
        self.rightArrow.hide();
    }
}

// 提出多处用到的animate代码
Banner.prototype.animate = function () {
    var self = this;
    //stop()作用：当切换到其它页面再返回到轮播图页面时，轮播的速度会加快，
    // 原因是animate做动画的时候可能产生动画叠加，所以要先把之前动画停掉，然后再执行当前动画
    self.bannerUl.stop().animate({"left":-798*self.index},500);
    // 首先要记录当前轮播图索引
    var index = self.index;
    // 轮播图下标            小点点下标
    // 0                   self.bannerCount-1
    // 1                   0
    // 2                   1
    // 3                   2
    // self.bannerCount+1    0
    // 412341
    // 轮播图片(加了前后2图)的索引为0时，小圆点的index指向的图片为最后一张图片
    if(index === 0) {
        // 4-1=3,索引为3即第4张图片(最后一张图片)
        index = self.bannerCount-1;
    }else if(index === self.bannerCount+1) {
        // 轮播图片(加了前后2图)的索引为最后一张时，小圆点的index指向的图片为第1张图片
        // 索引为0的图片即第1张图片
        index = 0;
    }else {
        // 其它情况，小圆点的index指向的图片索引为轮播图片的第几张-1(如轮播到第3张，那index=3,3-1=2,索引为2的小圆点是第3个点)
        // 即小圆点的index是从0开始，而self.index从1开始(因为在Bannder里面设置了this.index = 1;)
        index = self.index-1;
    }
    // 动态获取当前轮播到的图片，然后给这个图片的li标签设置为选中状态
    // eq(index)表示当前获取的是第几个小点点(li标签)
    self.pageControl.children('li').eq(index).addClass("active").siblings().removeClass("active");
};

// 轮播图循环
Banner.prototype.loop = function () {
    var self = this;
    // 找到id=banner-ul的元素(这里是包含4个li标签的ul标签)
    // var bannerUL = $("#banner-ul")
    // 设置left
    // 方法一：一步到位，没有过渡时间
    // bannerUL.css({"left":-798});
    // 方法二：有过渡时间(单位为毫秒)
    // bannerUL.animate({"left":-798},500)
    // 把timer定义成Banner的一个属性，这样就可以在其它函数中轻松的获取到这个timer
    this.timer = setInterval(function () {
        // 412341
        // 只有滚动到最后一张图片(第6张)才进行index更改
        // 不写死，如果有4张图，那添加2张就是6张（索引为5），所以4+1=5
        if(self.index >= self.bannerCount+1){
            // 显示原来的第一张图片(在索引为左侧1处，即left为-self.bannerWidth处)
            self.bannerUl.css({"left":-self.bannerWidth})
            // 下一张跳到索引为2的图片
            self.index = 2;
        }else {
            // 为什么在Banner函数中，设置默认index = 1就可以解决第一次轮播第一张图片时间占两个轮播时长的问题
            // 因为如果设置默认index=0的话，那第一次等待一次轮播间隔后，index++为1，
            // 此时还是处于第一张图片(因为第一张图片前面添加了最后一张图片)，于是第一张图片还要等待一个轮播间隔
            self.index++;
        }
        self.animate();
    },2000);
};

// 给左右箭头绑定监听事件
Banner.prototype.listenArrowClick = function () {
    var  self = this;
    self.leftArrow.click(function () {
        // ==：1 == '1'返回true
        // ===：1 ==='1'返回false，1 === 1返回true，即===更加强势，要求类型和数值都要相等才返回true
        if (self.index === 0) {
            // 412341
            // 当处于第一张图时(最前面的4)，我们要让轮播窗口立即变为右边的4，即left为-4*self.bannerWidth
            self.bannerUl.css({"left":-self.bannerCount*self.bannerWidth});
            // 那下次点击时就要变到3(所以为4-1=3)
            self.index = self.bannerCount - 1;
        } else {
            self.index--;
        }
        self.animate();
    });
    self.rightArrow.click(function () {
        // 当轮播图片(加了前后2图)到最后一张图片时（如有4图，那加2图就有6图(最后一张索引为5)，即bannerCount+1=4+1=5）
        if (self.index === self.bannerCount + 1) {
            // 412341
            // 当处于最后一张图时(最后面的1)，我们要让轮播窗口立即变为左边的1，即left为-self.bannerWidth
            self.bannerUl.css({"left":-self.bannerWidth});
            // 那下次点击时就要变到2(所以为2)
            self.index = 2;
        } else {
            self.index++;
        }
        self.animate();
    });
}

// 监听轮播窗口的hover事件，当鼠标处于轮播窗口上时，停止轮播，否则继续轮播
Banner.prototype.listenBannerHover = function () {
    // 在执行的函数之前定义一个变量self = this，此时这个this代表的是Banner对象
    var self = this;
    this.bannerGroup.hover(function () {
        // 第一个函数是，把鼠标移到到banner-group上会执行的函数
        // 注意：不能直接使用this.timer，因为这里的this是指的.hover里的function函数
        clearInterval(self.timer);
        // 显示箭头
        self.toggleArrow(true);
    },function () {
        // 第二个函数是，把鼠标从banner-group上移走会执行的函数
        // 重新启动定时器，继续循环轮播图
        self.loop();
        // 不显示箭头
        self.toggleArrow(false)
    });
};

// 给小圆点绑定监听事件
Banner.prototype.listenPageControl = function () {
    var self = this;
    // 获取pageContol盒子里的所有li标签，each会遍历所有li标签，
    // each会给function传2个参数，第一个是index值，第二个是li标签本身
    self.pageControl.children("li").each(function (index,obj) {
        // 先要把obj对象包装成jq对象，才能调用click方法
        $(obj).click(function () {
            // console.log(index)
            // 412341
            // index为0123，即当点击第一个点时，index为0，index+1=1，即指向索引为1的图片(第一张图片)
            // 当点击第2个点时，index为1，index+1=2,即指向索引为2的图片(第2张图片)
            // 同理，第3个点显示第3张图片，第4个点显示第4张图片
            self.index = index+1;
            // 滚动到记录的index下的图片
            self.animate();
            // 将当前点击的小圆点变为选中状态，并且其所有兄弟元素移除选中状态
            // 但此时小点选中状态不会随自动轮播变化到的图片而变化，
            // 其实每次执行animate就要更改一下active(执行下面这行代码)，所以把下面这行代码放到animate里
            // $(obj).addClass("active").siblings().removeClass("active");
        });
    });
};

// 首页轮播图run方法
Banner.prototype.run = function () {
    this.initBanner();
    this.initPageControl();
    this.loop();
    this.listenBannerHover();
    this.listenArrowClick();
    this.listenPageControl();
};

// 首页加载更多按钮部分
function Index() {
    var self = this;
    // 点击加载更多按钮时，默认加载出第2页新闻内容
    self.page = 2;
    self.category_id = 0;
    self.loadBtn = $("#load-more-btn");
}

// 监听加载更多按钮点击时间
Index.prototype.listenLoadMoreEvent = function () {
    var self = this;
    // 先按到加载更多按钮
    var loadBtn = $("#load-more-btn");
    // 给按钮绑定点击事件
    loadBtn.click(function () {
        xfzajax.get({
            'url': '/news/list/',
            'data':{
                // 点击加载更多按钮时，应该加载当前的page和当前分类(category_id)下的内容
                'p': self.page,
                'category_id': self.category_id
            },
            'success': function (result) {
                if(result['code'] === 200){
                    // 获取新闻类容
                    var newses = result['data'];
                    if(newses.length > 0){
                        // 把获取的新闻变成模板(这里可以得到html渲染的一个模板，然后就可以把模板拼接到ul标签里的li标签后了)
                        var tpl = template("news-item",{"newses":newses});
                        // 先获取新闻列表的ul标签
                        var ul = $(".list-inner-group");
                        // 然后将模板拼接到ul标签里面的li标签后面
                        ul.append(tpl);
                        // 每次点击加载更多按钮会加载出后一页的新闻内容
                        self.page += 1;
                    }else{
                        // 如果没有更多新闻了，那再点击加载跟多按钮就会隐藏这个按钮
                        loadBtn.hide();
                    }
                }
            }
        });
    });
};

// 监听分类点击事件
Index.prototype.listenCategorySwitchEvent = function () {
    var self = this;
    // 获取所有分类(即获取所有li标签)
    // 先获取ul标签，
    var tabGroup = $(".list-tab");
    // 然后用.children()方法来获取ul标签下的li标签，然后给li标签绑定点击事件
    tabGroup.children().click(function () {
        // this：代表当前选中的这个li标签
        var li = $(this);
        // 获取选中的li标签对应的分类
        var category_id = li.attr("data-category");
        // 点击相应分类后，应该获取当前分类下所有文章的第一页内容(不过为啥下面这行代码有无都可)
        var page = 1;
        xfzajax.get({
            'url': '/news/list/',
            'data': {
                'category_id': category_id,
                'p': page
            },
            'success': function (result) {
                if(result['code'] === 200){
                    // 获取新闻内容
                    var newses = result['data'];
                    // 把获取的新闻变成模板(先去html中写一个li标签的模板，看news/index.html第12行)
                    var tpl = template("news-item",{"newses":newses});
                    var newsListGroup = $(".list-inner-group");
                    // 当我们点击分类后，应该先清除当前分类的所有内容，
                    // empty：可以将这个标签下的所有子元素都删掉
                    newsListGroup.empty();
                    //然后把新的分类内容显示出来
                    newsListGroup.append(tpl);
                    // 由于上面使得page=1(分类用的)，那这里要改回来(加载更多按钮用的)(不过为啥下面这行代码有无都可)
                    self.page = 2;
                    // 记录当前分类的id(在listenLoadMoreEvent方法中使用，否则点击当前分类的加载更多按钮时会把其它分类也加载出来)
                    self.category_id = category_id;
                    // 将当前选中分类变成选中状态，且要移除当前分类外的其它分类(siblings():兄弟元素)的选中状态
                    li.addClass('active').siblings().removeClass('active');
                    // 显示加载更多按钮(因为在listenLoadMoreEvent方法中当没有更多内容就会隐藏按钮，所以这里要再显示出来)
                    self.loadBtn.show();
                }
            }
        });
    });
};

// 首页新闻列表run方法
Index.prototype.run = function () {
    var self = this;
    self.listenLoadMoreEvent();
    self.listenCategorySwitchEvent();
};

// 确保在执行run方法前，html文档已经被加载完毕，
// 如果在$()函数中传了另外一个函数（这里是function函数，那它就会保证function函数里的代码在整个文档全部加载完毕后才执行)
$(function () {
    var banner = new Banner();
    banner.run();

    var index = new Index();
    index.run();
});