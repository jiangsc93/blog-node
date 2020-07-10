const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');

// 评论模型
const commentSchema = new mongoose.Schema({
	// 评论所在的文章 id
	article_id: mongoose.Schema.Types.ObjectId,
	// 评论内容
	content: String,
	// 点赞次数
	like: { type: Number, default: 0 },
	// 创建日期
	create_time: { type: Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },
	// 用户id
	owner_id: mongoose.Schema.Types.ObjectId,
	// 用户资料
	owner_info: Object,
	// 回复者id
	replier_id: mongoose.Schema.Types.ObjectId,
	// 回复者资料
	replier_info: Object,
	// 其他回复
	children: Array
});

// 标签模型
module.exports = mongoose.model('Comment', commentSchema);
