const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');

// 关注模型
const followSchema = new mongoose.Schema({
	// 关注类型  article 、 following、 follower
	type: { type: String },
	// 关注所在的文章 id
	article_id: mongoose.Schema.Types.ObjectId,
	// 创建日期
	create_time: { type: Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },
	// 被关注者id
	owner_id: mongoose.Schema.Types.ObjectId,
	// 被关注者资料
	owner_info: Object,
	// 关注者
	follower_id: mongoose.Schema.Types.ObjectId,
	// 关注者资料
	follower_info: Object,
	isCurentUserFollowed: Boolean,
});

// 标签模型
module.exports = mongoose.model('Follow', followSchema);
