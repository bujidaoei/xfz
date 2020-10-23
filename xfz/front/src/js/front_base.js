// 模板
// function NavBar() {
// };
// NavBar.prototype.run = function () {
//     var self = this;
//     self.listenNavClickEvent();
// };
// NavBar.prototype.listenNavClickEvent = function () {
//
// };
// $(function () {
//    var navbar = new NavBar();
//    navbar.run();
// });

// 专门用来控制导航条的，前端所有和注册授权相关的东西在Auth类中来写

// 用来处理登录者用户名的hover事件
function FrontBase() {
}
// FrontBase对象入口
FrontBase.prototype.run = function () {
    var self = this;
    self.listenAuthBoxHover();
};
// 监听auth-box(登录后按钮)的Hover事件(当鼠标移到用户名上时，显示额外的框(包括如管理系统，退出登录等))
FrontBase.prototype.listenAuthBoxHover = function () {
    var authBox = $(".auth-box");
    var userMoreBox = $(".user-more-box");
    // 当鼠标移到登录候按钮上时，显示userMoreBox
    authBox.hover(function () {
        userMoreBox.show();
    }, function () {
        userMoreBox.hide();
    });
};


// 用来处理登录和注册的
function Auth() {
    var self = this;
    self.maskWrapper = $('.mask-wrapper');  // 遮罩
    self.scrollWrapper = $(".scroll-wrapper");  // 包含登录和注册页面的大盒子
    self.smsCaptcha = $('.sms-captcha-btn');    // 发送验证按钮
}

Auth.prototype.run = function () {
    var self = this;
    self.listenShowHideEvent();
    self.listenSwitchEvent();
    self.listenSigninEvent();
    self.listenImgCaptchaEvent();
    self.listenSmsCaptchaEvent();
    self.listenSignupEvent();
};
// 显示遮罩
Auth.prototype.showEvent = function () {
    var self = this;
    self.maskWrapper.show();
};
// 隐藏遮罩
Auth.prototype.hideEvent = function () {
    var self = this;
    self.maskWrapper.hide();
};

// 短信验证码发送成功
Auth.prototype.smsSuccessEvent = function () {
    var self = this;
    // 提示短信验证码发送成功
    messageBox.showSuccess('短信验证码发送成功！');
    // 发送短信验证码按钮暂时不可用状态(disabled是在auth.scss中自己写的)
    self.smsCaptcha.addClass('disabled');
    // 设置倒计时数字
    var count = 60;
    // 上面的设置发送短信验证码按钮暂时不可用状态只是一个表象，实际上还是可以点击，
    // 所以要取消按钮点击事件的绑定
    self.smsCaptcha.unbind('click');
    // 设置定时器
    var timer = setInterval(function () {
        self.smsCaptcha.text(count + 's');
        count -= 1;
        if (count <= 0) {
            // 倒计时为0后，清除定时器
            clearInterval(timer);
            // 发送短信验证码按钮变为可用状态
            self.smsCaptcha.removeClass('disabled');
            self.smsCaptcha.text('发送验证码');
            // 前面取消了按钮点击时间的绑定，当倒计时结束后，我们应该重新调用listenSmsCaptchaEvent函数
            // 这样就又可以重新绑定按钮点击事件了
            self.listenSmsCaptchaEvent();
        }
    }, 1000);
};

// 点击登录按钮显示登录界面，点击注册按钮显示注册界面，点击叉号关闭登录/注册页面
Auth.prototype.listenShowHideEvent = function () {
    var self = this;
    // 先找到登录/注册和叉号按钮
    var signinBtn = $('.signin-btn');
    var signupBtn = $('.signup-btn');
    var closeBtn = $('.close-btn');
    // 点击登录按钮时，显示登录界面
    signinBtn.click(function () {
        self.showEvent();
        self.scrollWrapper.css({"left": 0});
    });
    // 点击注册按钮时，显示注册界面
    signupBtn.click(function () {
        self.showEvent();
        self.scrollWrapper.css({"left": -400});
    });
    // 点击叉号时，隐藏登录/注册界面
    closeBtn.click(function () {
        self.hideEvent();
    });
};

// 监听登录和注册切换功能(即在登录页面点击立即注册可以切换到注册页面，在注册页面点击立即登录可以切换到登录页面)
Auth.prototype.listenSwitchEvent = function () {
    var self = this;
    var switcher = $(".switch");
    switcher.click(function () {
        var currentLeft = self.scrollWrapper.css("left");
        currentLeft = parseInt(currentLeft);
        if (currentLeft < 0) {
            self.scrollWrapper.animate({"left": '0'});
        } else {
            self.scrollWrapper.animate({"left": "-400px"});
        }
    });
};

// 监听图形验证码点击事件
Auth.prototype.listenImgCaptchaEvent = function () {
    var imgCaptcha = $('.img-captcha');
    imgCaptcha.click(function () {
        // 怎么能够更改图片？重新请求一下url即可
        // 但是此时url是固定的，那怎么办？我们可以给url后面加上一个随机的查询字符串的参数(?xxx=xxx)
        // Math.random()会返回一个0-1间的小数
        imgCaptcha.attr("src", "/account/img_captcha/" + "?random=" + Math.random())
    });
};

// 监听短信验证码事件
Auth.prototype.listenSmsCaptchaEvent = function () {
    var self = this;
    // 拿到发送验证码按钮
    var smsCaptcha = $(".sms-captcha-btn");
    // 拿到注册界面的手机号码输入框
    var telephoneInput = $(".signup-group input[name='telephone']");
    smsCaptcha.click(function () {
        // 如果点了发送验证码按钮，就获取手机号码输入框中的内容
        var telephone = telephoneInput.val();
        if (!telephone) {
            messageBox.showInfo('请输入手机号码！');
        }
        // 执行ajkx请求来获取短信验证码
        xfzajax.get({
            'url': '/account/sms_captcha/',
            'data': {
                'telephone': telephone
            },
            'success': function (result) {
                if (result['code'] == 200) {
                    // 如果短信验证码发送成功，那发送短信验证码这个按钮就暂时不能用，并进入一个倒计时
                    self.smsSuccessEvent();
                }
            },
            'fail': function (error) {
                console.log(error);
            }
        });
    });
};

// 监听登录事件,当输入账号密码后，点击登录会把登录信息发送过给服务器
Auth.prototype.listenSigninEvent = function () {
    var self = this;
    // 先找到登录盒子
    var signinGroup = $('.signin-group');
    // 然后获取登录盒子中的输入框（电话号，密码，记住我）
    var telephoneInput = signinGroup.find("input[name='telephone']");
    var passwordInput = signinGroup.find("input[name='password']");
    var rememberInput = signinGroup.find("input[name='remember']");
    // 找到输入框后就要提取输入框里的内容
    // 但是提取数据要在点击登录按钮后才去提取，所以要拿到登录按钮
    var submitBtn = signinGroup.find(".submit-btn");
    // 给登录按钮绑定点击事件，如果登录按钮点击了，就提取输入框里的内容
    submitBtn.click(function () {
        var telephone = telephoneInput.val();
        var password = passwordInput.val();
        // 如果勾选了，那prop("checked")会返回true，否则返回false
        var remember = rememberInput.prop("checked");
        // 提取到内容后就要通过ajks请求把数据发送给服务器
        // 因为我们现在发送数据是采用post请求，而post请求在django中做了一层csrf校验，那我们就要对ajax请求做一些手脚(xfzajax.js)
        // 因为是发送post请求，所以是xfzajax.post
        xfzajax.post({
            // 登录的url
            'url': '/account/login/',
            // data是要发送的数据
            'data': {
                'telephone': telephone,
                'password': password,
                'remember': remember ? 1 : 0
            },
            // xfzajax里面封装了成功的回调
            'success': function (result) {
                self.hideEvent();
                // 不用self.hideEvent()，因为reload页面就已经把登录页面隐藏了(但如果登录失败并不希望把登录界面隐藏掉)
                window.location.reload();
            },
        });
    });
};

// 监听注册事件
Auth.prototype.listenSignupEvent = function () {
    // 先找到注册盒子
    var signupGroup = $('.signup-group');
    // 再从注册盒子中找到注册按钮
    var submitBtn = signupGroup.find('.submit-btn');
    // 给注册按钮绑定点击事件
    submitBtn.click(function (event) {
        // 如果给提交按钮绑定点击时间，想要去重写点击事件，那最好先阻止默认行为(如果把按钮放到form标签中，那以后点击提交按钮时，会执行默认的提交表单的行为)
        // 这里由于注册按钮没有放到form标签中，所以可以不用写下面这行代码，但是还是要养成写的好习惯
        event.preventDefault();
        // 要想获取输入框中的内容，首先要获取输入框
        var telephoneInput = signupGroup.find("input[name='telephone']");
        var usernameInput = signupGroup.find("input[name='username']");
        var imgCaptchaInput = signupGroup.find("input[name='img_captcha']");
        var password1Input = signupGroup.find("input[name='password1']");
        var password2Input = signupGroup.find("input[name='password2']");
        var smsCaptchaInput = signupGroup.find("input[name='sms_captcha']");
        // 然后再从输入框中获取内容
        var telephone = telephoneInput.val();
        var username = usernameInput.val();
        var img_captcha = imgCaptchaInput.val();
        var password1 = password1Input.val();
        var password2 = password2Input.val();
        var sms_captcha = smsCaptchaInput.val();
    //     if (telephone === ''){
    //     // messageBox为外部引用js代码, 主要是显示提示信息的功能
    //     window.messageBox.showError('请输入手机号!');
    //     return  // 使用return的目的是为了当满足当前条件的时候就停止执行后续的判断
    // }
        // 拿到输入框内容后，就可以通过ajkx把数据提交给服务器
        xfzajax.post({
            'url': '/account/register/',
            'data': {
                'telephone': telephone,
                'username': username,
                'img_captcha': img_captcha,
                'password1': password1,
                'password2': password2,
                'sms_captcha': sms_captcha
            },
            // 注册界面错误信息都在xfzauth/form.py/LoginForm做处理了？所以不用写如signin的回调？
            // xfzajax里面封装了成功的回调
            'success': function (result) {
                // 注册成功的话，重新加载当前页面
                window.location.reload();
            }
        });
    });
};


$(function () {
    var auth = new Auth();
    auth.run();
});


$(function () {
    var frontBase = new FrontBase();
    frontBase.run();
});

// 将时间格式化(使用timesince这个过滤器)
$(function () {
    // 因为不是所有的页面都使用到了art-template，所以要判断一下，如果有template这个变量，
    // 说明当前页面加载了art-template(如果不判断就执行下面代码就会报错)
    if (window.template) {
        template.defaults.imports.timeSince = function (dateValue) {
            var date = new Date(dateValue);
            var datets = date.getTime(); // 得到的是毫秒的
            var nowts = (new Date()).getTime(); //得到的是当前时间的时间戳
            var timestamp = (nowts - datets) / 1000; // 除以1000，得到的是秒
            if (timestamp < 60) {
                return '刚刚';
            } else if (timestamp >= 60 && timestamp < 60 * 60) {
                minutes = parseInt(timestamp / 60);
                return minutes + '分钟前';
            } else if (timestamp >= 60 * 60 && timestamp < 60 * 60 * 24) {
                hours = parseInt(timestamp / 60 / 60);
                return hours + '小时前';
            } else if (timestamp >= 60 * 60 * 24 && timestamp < 60 * 60 * 24 * 30) {
                days = parseInt(timestamp / 60 / 60 / 24);
                return days + '天前';
            } else {
                var year = date.getFullYear();
                var month = date.getMonth();
                var day = date.getDay();
                var hour = date.getHours();
                var minute = date.getMinutes();
                return year + '/' + month + '/' + day + " " + hour + ":" + minute;
            }
        }
    }
});