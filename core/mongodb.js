//引用mongoose模块
const mongoose = require('mongoose');
const consola = require('consola');
mongoose.Promise = global.Promise;
// mongoose
exports.mongoose = mongoose

//连接数据库
const port = process.env.NODE_ENV === 'production' ? ':18810' : '';
// const port = ':18810';
// mongoose.connect('mongodb://localhost:18810/blogdata', {useMongoClient: true})

exports.connect = () => {
  mongoose.connect(`mongodb://localhost${port}/blogdata`, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true})
  // mongoose.connect(`mongodb://39.96.10.130${port}/blogdata`, {useNewUrlParser: true, useFindAndModify: false, useCreateIndex: true, useUnifiedTopology: true})
  // mongoose.connect(`mongodb://39.96.10.130:18811/blogtest`, {useMongoClient: true})
  const db = mongoose.connection;
  db.once('error',() => consola.warn('Mongo 连接失败!'));
  db.once('open',() => consola.ready('mongodb 连接成功!'));
  // 返回实例
  return mongoose;
}