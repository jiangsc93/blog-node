const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');

// 关注模型
const collectSchema = new mongoose.Schema({
	// 创建日期
	create_time: { type: Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },
	// 被收藏的文章id
	article_id: mongoose.Schema.Types.ObjectId,
	// 收藏者
	collecter_id: mongoose.Schema.Types.ObjectId,
});

// 标签模型
module.exports = mongoose.model('Collect', collectSchema);
