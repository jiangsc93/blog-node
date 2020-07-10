const { mongoose } = require('../core/mongodb.js');
const moment = require('moment');
// 创建对象定义集合结构类型(其实就是表结构)
const categorySchema = new mongoose.Schema({

	name: { type: String, required: true, validate: /\S+/ },

	// 分类描述
	desc: { type: String, default: '' },

	// 创建日期
	create_time: { type: Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },

	// 最后修改日期
	update_time: { type: Date, default: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') },
});

// 用户
module.exports = mongoose.model('Category', categorySchema);

