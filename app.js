const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');
// 压缩
const compression = require('compression');
const log4js = require('log4js');
// 引入文件模块
const fs = require('fs');
// 引入处理post数据的模块
const bodyParser = require('body-parser');

// import require 等语法需要用到babel支持
require('babel-register');


const app = express();

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

// 设置cookie
app.use(cookieParser('blog_node_cookie'));
app.use(
	session({
		secret: 'blog_node_cookie',
		name: 'session_id', // 在浏览器中生成cookie的名称key，默认是connect.sid
		resave: true,
		saveUninitialized: true,
		cookie: { maxAge: 60 * 1000 * 30, httpOnly: true }, // 过期时间
	}),
);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression({ threshold: 0 }));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// CORS解决跨域问题
app.all('*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // 最核心的
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE");
  res.header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
  res.header("Cache-Control", "max-age=360000");
  next();
});

// 导入连接mongodb
const mongodb = require('./core/mongodb');
// data server
mongodb.connect();

log4js.configure("./util/log4js.json");
app.use(log4js.connectLogger(log4js.getLogger(), { level: 'info' }));

//将路由文件引入
const route = require('./routes/index');
//初始化所有路由
route(app);


// 静态资源处理
app.get('/upload/*', function (req, res) {

  let file_path = __dirname + req.url;
  fs.readFile(file_path, 'binary', function (err, data) {
    console.log(data, 'data');
    if (err) {
      console.log(err, 'error');
    } else {
      //不加这句，页面可能会乱码，图片包含中文也会乱码
      res.writeHead(200, {
          'Content-Type': 'image/jpeg'
      });
      res.write(data, 'binary');
      res.end();
    }
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  console.log(err, 'err');
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
