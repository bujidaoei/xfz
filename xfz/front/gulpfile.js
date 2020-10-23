var gulp = require("gulp");
var cssnano = require("gulp-cssnano");
var rename = require("gulp-rename");
var uglify = require("gulp-uglify");
var concat = require("gulp-concat");
var cache = require('gulp-cache');
var imagemin = require('gulp-imagemin');
var bs = require('browser-sync').create();
var sass = require("gulp-sass")
// 但我下面两个包好像都没有效果，可能是安装问题
// 如果出现js错误，把错误信息打印出来，而不是简单粗暴的退出gulp server
var util = require("gulp-util")
// 我们引用的js是.min(压缩后的，所有代码处于第一行)，那以后你写js代码时出问题后，会在浏览器中显示错误信息，
// 而由于压缩后的代码都在第一行，因此不能具体定义到具体哪一行js代码出错，
// 而gulp-sourcemaps就是来解决这个问题的，在js出错时，可以找到原来的js文件出错的位置，
var sourcemaps = require("gulp-sourcemaps")

var path = {
    //**代表中间有任意多个目录，我只要找到最后一个html文件即可
    'html': './templatetags/**/',
    'css': './src/css/**/',
    'js': './src/js/**/',
    'images': './src/images/**/',
    'css_dist': './dist/css/',
    'js_dist': './dist/js/',
    'images_dist': './dist/images/'
};

// 处理html文件的任务
gulp.task("html",function (cb) {
    gulp.src(path.html + '*.html')
        .pipe(bs.stream())
    cb()
});

// 定义一个css的任务
//方式一
gulp.task("css",function (cb) {
    gulp.src(path.css + '*.scss')
        .pipe(sass().on("error",sass.logError))
        .pipe(cssnano())
        .pipe(rename({"suffix":".min"}))
        .pipe(gulp.dest(path.css_dist))
        .pipe(bs.stream())
    cb()
});
//方式二
gulp.task("css2",() =>{
    return gulp.src(path.css + '*.css')
        .pipe(cssnano())
        .pipe(rename({"suffix":".min2"}))
        .pipe(gulp.dest(path.css_dist))
        .pipe(bs.stream())
})

// 定义处理js文件的任务
//方式一
gulp.task("js",function (cb) {
    gulp.src(path.js + '*.js')
        // 在所有js处理之前执行init
        // .pipe(sourcemaps.init())
        // 在处理js文件时如果出现错误，会执行util.log函数(打印错误信息)
        // .pipe(uglify().on("error",util.log))
        .pipe(uglify())
        .pipe(rename({"suffix":".min"}))
        .pipe(gulp.dest(path.js_dist))
        // 在所有js文件处理之后执行write
        // .pipe(sourcemaps.write())
        .pipe(bs.stream())
    cb()
});
//方式二(function ()可以改为() =>)
gulp.task("js2",function () {
    return gulp.src(path.js + '*.js')
        .pipe(uglify({
            toplevel:true,
            // compress:{
            //     'drop_console':true
            // }
        }))
        .pipe(rename({"suffix":".min2"}))
        .pipe(gulp.dest(path.js_dist))
        .pipe(bs.stream())
})

//合并两个js文件
//方式一
gulp.task('mergejs',function(cb){
    //读取js目录下所有的js文件
    gulp.src(path.js+'*.js')
     //把所有的js文件通过管道传给concat做拼接，并且指定文件名
    .pipe(concat('index.merge.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
    cb()
});
//方式二
gulp.task('mergejs2',function(){
    //读取js目录下所有的js文件
    return gulp.src(path.js+'*.js')
     //把所有的js文件通过管道传给concat做拼接，并且指定文件名
    .pipe(concat('index.merge2.js'))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js/'));
});

// 定义处理图片文件的任务
gulp.task('images',function (cb) {
    gulp.src(path.images + '*.*')
        .pipe(cache(imagemin()))
        .pipe(gulp.dest(path.images_dist))
        .pipe(bs.stream())
    cb()
});

// 定义监听文件修改的任务
gulp.task("watch",function () {
    gulp.watch(path.html + '*.html',gulp.series('html'));
    gulp.watch(path.css + '*.scss',gulp.series('css'));
    gulp.watch(path.js + '*.js',gulp.series('js'));
    gulp.watch(path.images + '*.*',gulp.series('images'));
});

// 初始化browser-sync的任务
gulp.task("bs",function (cb) {
    bs.init({
        // 对server来做配置
        'server': {
            // 服务器一旦启动会在baseDir去找
            'baseDir': './'
        }
    });
    cb()
});

// gulp指令默认执行的任务，series为串行执行，parallel为并行执行。这里先编译，后更改html文件
// 中断可以直接输入gulp（而不用输入gulp default）
gulp.task('default', gulp.series(gulp.parallel('css', 'js', 'images'), 'html'));

// 开启服务器并实时更新页面
// 执行gulp server开启服务器（要想执行server任务，得先执行bs和watch任务）
// gulp.task('server', gulp.series('default', gulp.parallel('bs', 'watch')));
// 前面我们是去监听文件的修改，如果有任何修改，就会自动刷新浏览器，但是现在就不能这样做了，
// 因为现在的页面并不是通过gulp的方式来进行渲染的，而是通过django渲染的（所以就不需要bs了，只需要监听文件修改即可）
gulp.task('server', gulp.series('default', 'watch'));