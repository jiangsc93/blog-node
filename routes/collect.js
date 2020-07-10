const _ = require('lodash');
let moment = require('moment');
let util = require('../util/util');
let ArticleModel = require('../models/article');
let CollectModel = require('../models/collect');
let UserModel = require('../models/user_model');
const verify = require('../util/verify');
let { responseClient } = util;


// 添加收藏
exports.collect = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { article_id, collecter_id } = req.body;

  let Collect = new CollectModel({
    article_id,
    collecter_id,
    create_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  });
  // 保存到收藏表里
  Collect
    .save()
    .then(collectResult => {
      if (collectResult) {
        responseClient(res, 200, 'success', collectResult);
      } else {
        responseClient(res, 400, 'error');
      }
    })
};



// 取消收藏
exports.uncollect = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { article_id, collecter_id } = req.body;
  
  CollectModel.deleteOne({ article_id, collecter_id }, (errors, data) => {
    if (errors) {
      responseClient(res, 400, 'error');
    } else {
      responseClient(res, 200, 'success', data);
    }
  })
}


// 按条件获取收藏或被收藏列表
exports.queryCollectList = (req, res) => {
  let { pageIndex, pageSize, collecter_id } = req.body;
  if (pageIndex == null) {
    pageIndex = 1;
  }
  if (pageSize == null) {
    pageSize = 5;
  }
  let responseData = {
    hasNextPage: true,
    pageIndex: Number(pageIndex),
    pageSize: Number(pageSize),
    collectList: []
  }
  CollectModel.aggregate([
    {
      $lookup:
        {
          from: "articles",
          localField: "article_id",
          foreignField: "_id",
          as: "article_info"
        }
    },
  ], function(err, docs) {
    if (err) {
      console.log(err);
      return;
    }
    let list = docs;
    _.filter(list, item => {
      if (item.collecter_id.toString() === collecter_id) {
        responseData.collectList.push(item);
      }
    });
    responseClient(res, 200, 'success', responseData);
  })
}



