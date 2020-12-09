const crypto = require('crypto');
var Geetest = require('gt3-sdk');
let _ = require('lodash');

module.exports = {
	MD5_SALT: 'jsc1993@#0220*%',
	
	md5: function(pwd) {
		let md5 = crypto.createHash('md5');
		return md5.update(pwd).digest('hex');
	},

	// 响应客户端
	responseClient(res, httpCode = 500, message = '服务端异常', data = {}) {
		let responseData = {};
		responseData.code = httpCode;
		responseData.message = message;
		responseData.data = data;
		res.status(httpCode).send(responseData);
	},

	captcha: new Geetest({
		geetest_id: '7892109bbe367080435f3d73236488ce',
		geetest_key: '8ecabdbf93c69a933ea4582cd87905fe'
	}),

	inputCheck(val) {
		let textList = [
			'傻逼', '共产党', '妈卖批', '狗日', 
		]
		let returnObj = {
			checkResult: true,
			badWords: ''
		}
    _.some(textList, item => {
			if (val.indexOf(item) > -1) {
				returnObj.checkResult = false;
				returnObj.badWords = item;
			}
		})
		return returnObj;
	}
};
