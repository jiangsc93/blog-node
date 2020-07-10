const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');
const crypto = require('crypto');
const { argv } = require('yargs');
// 创建对象定义集合结构类型(其实就是表结构)
const userSchema = new mongoose.Schema({
  userName: String,
  email: String,
  password: {
    type: String,
    required: true,
    default: crypto
      .createHash('md5')
      .update(argv.auth_default_password || 'root')
      .digest('hex'),
  },
  avatar: { type: String, default: 'http://www.jscwwd.com:3000/upload/avatar_202006141544.png' },
  introduce: String,
  position: String,
  company: String,
  homePage: String,
  articleNum: Number,
  follows_num: Number,
  currentUserFollowed: Boolean,
  totalLikes: Number,
  totalVisits: Number,
  followings: Number,
  followers: Number,
  collectArticles: Number,
  level: {
    type: Number,
    default: 1
  },
  create_time: {
    type: String,
    default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  },
  update_time: {
    type: String,
    default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  }
});

// 用户
module.exports = mongoose.model('User', userSchema);

