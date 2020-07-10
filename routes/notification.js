const _ = require('lodash');
let moment = require('moment');
let util = require('../util/util');
let FollowModel = require('../models/follow');
let CommentModel = require('../models/comment');
let LikeModel = require('../models/like');
const verify = require('../util/verify');
let { responseClient } = util;

function multisort(array, ...compairers) {
  return array.sort((a, b) => {
      for (const c of compairers) {
          const r = c(a, b);
          if (r !== 0) {
              return r;
          }
      }
  });
}

// 获取最近的用户通知
exports.getUserNotification = (req, res) => {
  let { pageIndex, pageSize, userId, type } = req.body;
  let responseData = {
    hasNextPage: true,
    pageIndex: Number(pageIndex),
    pageSize: Number(pageSize),
    list: []
  }
  if (type === 'system') responseClient(res, 200, 'success', responseData);
  if (pageIndex == null) {
    pageIndex = 1;
  }
  if (pageSize == null) {
    pageSize = 20;
  }
  let list = [];
  let skip = (responseData.pageIndex - 1) * responseData.pageSize;
  let conditions = {};
  let fields = {};
  // 查询关注我的列表
  FollowModel.find({owner_id: userId})
    .then(result1 => {
      let resList1 = [];
      result1.forEach(item => {
        resList1.push(Object.assign({}, item._doc, { itemType: 'follow' }));
      })
      list = list.concat(resList1);
      // 链接评论和文章两个表
      console.log(userId, 'userid');
      CommentModel.aggregate([
        {
          $lookup:
            {
              from: "articles",
              localField: "article_id",
              foreignField: "_id",
              as: "article_info"
            }
        },
        {
          $match: {
            "article_info": { $ne: [] },
            // "article_info.uid": { $in: userId }
          }
        },
        {
          $project:
          {
              _id: 1,
              "article_id": 1,
              "article_info.title": 1,
              "article_info._id": 1,
              "article_id": 1,
              "content": 1,
              "like": 1,
              "create_time": 1,
              "owner_id": 1,
              "owner_info": 1,
              "replier_id": 1,
              "replier_info": 1,
              "children": 1
          }
        }
      ], function(err, docs) {
        let resList2 = [];
        _.forEach(docs, (item, index) => {
          if (item.owner_id.toString() === userId) {
            resList2.push(Object.assign({}, item, { itemType: 'comment' }));
          }
        })
        list = list.concat(resList2);
        LikeModel.aggregate([
          {
            $lookup:
              {
                from: "users",
                localField: "liker_id",
                foreignField: "_id",
                as: "liker_info"
              }
          },
          {
            $lookup:
              {
                from: "articles",
                localField: "article_id",
                foreignField: "_id",
                as: "article_info"
              }
          }
        ], function(err, docs) {
          let resList3 = [];
          _.forEach(docs, (item, index) => {
            if (item.liker_id.toString() === userId) {
              resList3.push(Object.assign({}, item, { itemType: 'like' }));
            }
          })
          list = list.concat(resList3);
          // 按时间倒序排序
          let arr = multisort(list, (a, b) => {
            return moment(b.create_time).valueOf() - moment(a.create_time).valueOf()
          });
          responseData.list = arr;
          responseClient(res, 200, 'success', responseData);
        })
      })
    })
}