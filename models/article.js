const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');
// 创建对象定义集合结构类型(其实就是表结构)
const listSchema = new mongoose.Schema({
  title: { type: String, required: true, validate: /\S+/ },
  author: { type: String, required: true, validate: /\S+/ },
  category: String,
  tag: String,
  imgSrc: String,
  avatar: String,
  conversionId: String,
  // uid: mongoose.Schema.Types.ObjectId,
  uid: String,
  // 点赞的用户
	like_users: { type: Array, default: [] },
  state: { // 0 发布， 1 草稿
    type: Number, default: 0
  },
  beginDate: {
    type: String,
    default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  },
  lastDate: {
    type: String,
    default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  },
  summary: { type: String, required: true, validate: /\S+/ },
  content: { type: String, required: true, validate: /\S+/ },
  like: { type: Number, default: 0 },
  visit: { type: Number, required: true, default: 0 },
  comments_num: { type: Number, default: 0 },
  // 关注者数量
  follows_num: { type: Number, default: 0 },
}, {usePushEach: true});

// 列表
module.exports = mongoose.model('Article', listSchema);

