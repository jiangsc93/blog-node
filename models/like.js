const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');

// 点赞模型
const likeSchema = new mongoose.Schema({
	// 点赞所在的文章 id
	article_id: mongoose.Schema.Types.ObjectId,
  owner_id: mongoose.Schema.Types.ObjectId,
	// 点赞者
	liker_id: mongoose.Schema.Types.ObjectId,
	// 创建日期
	create_time: { type: Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },
});

// 标签模型
module.exports = mongoose.model('Like', likeSchema);
