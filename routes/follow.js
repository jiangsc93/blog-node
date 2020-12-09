const _ = require('lodash');
let moment = require('moment');
let util = require('../util/util');
let ArticleModel = require('../models/article');
let FollowModel = require('../models/follow');
let UserModel = require('../models/user_model');
const verify = require('../util/verify');
let { responseClient } = util;


// 添加关注
exports.follow = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { type, follower_id, owner_id, follow_id } = req.body;
  FollowModel.find({follower_id})
    .then(result0 => {
      let isFollowed = false;
      _.some(result0, item => {
        if (item.owner_id.toString() === owner_id) {
          isFollowed = false;
        }
      })
      if (isFollowed) responseClient(res, 400, '已经关注Ta啦');
      return;
    })
  // 查找被评论和评论者的资料
  UserModel.findOne(
    {
      _id: owner_id,
    },
    {
      _id: 1,
      email: 1,
      userName: 1,
      introduce: 1,
      avatar: 1,
      position: 1,
      company: 1,
      articleNum: 1,
      homePage: 1,
      level: 1,
    }
  ).then(result1 => {
    if (result1) { // 用户存在
      if (!result1.follows_num) result1.follows_num = 0;
      result1.follows_num += 1;
      UserModel.updateOne(
        {
          _id: owner_id
        },
        { follows_num: result1.follows_num}
        ).then(() => {
          UserModel.findOne(
            {
              _id: follower_id,
            },
            {
              _id: 1,
              email: 1,
              userName: 1,
              introduce: 1,
              avatar: 1,
              position: 1,
              company: 1,
              articleNum: 1,
              homePage: 1,
              level: 1,
            }
          ).then(result2 => {
            if (!result2) { // 用户不存在
              responseClient(res, 200, '此用户不存在');
            } else {
              let Follow = new FollowModel({
                type: type,
                owner_id: owner_id,
                owner_info: result1,
                follower_id: follower_id,
                follower_info: result2,
                create_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
              });
              Follow
                .save()
                .then(collectResult => {
                  responseClient(res, 200, 'success', collectResult);
                })
            }
          })
        })
    } else {
      responseClient(res, 200, '此用户不存在');
    }
  })
};


// 取消关注
exports.unfollow = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { owner_id, follower_id } = req.body;
  FollowModel.find({ follower_id }, (errors, data0) => {
    if (errors) {
      console.error('Error:' + errors);
    } else {
      let follow_id = '';
      _.forEach(data0, item => {
        if (item.owner_id.toString() === owner_id) {
          follow_id = item._id;
        }
      })
      FollowModel.deleteOne({ _id: follow_id }, (errors, data) => {
        if (errors) {
          responseClient(res, 400, 'error');
        } else {
          // 找到被关注的userid
          UserModel.findOne({_id: owner_id}, (errors, data1) => {
            if (errors) {
              console.error('Error:' + errors);
            } else {
              data1.follows_num -= 1;
              UserModel.updateOne(
                { _id: data0.article_id },
                { follows_num: data1.follows_num },
              ).then(result => {
                  responseClient(res, 200, 'success', data);
                })
                .catch(err => {
                  console.error('err :', err);
                  throw err;
                });
            }
          });
        }
      })
    }
  })
};


// 按条件获取关注的或被关注列表
exports.queryFollowList = (req, res) => {
  let { pageIndex, pageSize, author_id, userId, type } = req.body;
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
    followList: []
  }
  if (type === 'followers') {
    FollowModel.aggregate([
      {
        $lookup:
          {
            from: "users",
            localField: "owner_id",
            foreignField: "_id",
            as: "followerList"
          }
      }
    ], function(err, docs) {
      if (err) {
        console.log(err);
        return;
      }
      let currentUserFollowList = [];
      // 找到当前用户关注的用户列表
      _.forEach(docs, item => {
        if (item.follower_id.toString() === userId) {
          currentUserFollowList.push(item.owner_id.toString());
        }
      })
      FollowModel.find({owner_id: author_id})
        .then(followList => {
          let followAuthorList = followList;
          _.forEach(followAuthorList, item => {
            if (currentUserFollowList.includes(item.follower_id.toString())) {
              item.isCurentUserFollowed = true;
            } else {
              item.isCurentUserFollowed = false;
            }
          })
          responseData.followList = followAuthorList;
          responseData.hasNextPage = followAuthorList.length < 5 ? false : true;
          responseClient(res, 200, 'success', responseData);
        })
    })
  } else {
      FollowModel.aggregate([
        {
          $lookup:
            {
              from: "users",
              localField: "follower_id",
              foreignField: "_id",
              as: "followerList"
            }
        }
      ], function(err, docs) {
        if (err) {
          console.log(err);
          return;
        }
        let currentUserFollowList = [];
      // 找到当前用户关注的用户列表
      _.forEach(docs, item => {
        if (item.follower_id.toString() === userId) {
          currentUserFollowList.push(item.owner_id.toString());
        }
      })
      FollowModel.find({follower_id: author_id})
        .then(followList => {
          let followAuthorList = followList;
          _.forEach(followAuthorList, item => {
            if (currentUserFollowList.includes(item.owner_id.toString())) {
              item.isCurentUserFollowed = true;
            } else {
              item.isCurentUserFollowed = false;
            }
          })
          responseData.followList = followAuthorList;
          responseData.hasNextPage = followAuthorList.length < 5 ? false : true;
          responseClient(res, 200, 'success', responseData);
        })
      })
  }
};
