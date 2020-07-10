const _ = require('lodash');
let moment = require('moment');
let util = require('../util/util');
let FollowModel = require('../models/follow');
let LikeModel = require('../models/like');
let CollectModel = require('../models/collect');
let ArticleModel = require('../models/article');
const verify = require('../util/verify');
let { responseClient } = util;



// 查询当前用户是否赞过这篇文章
exports.likeAndFollowStatus = (req, res) => {
  let { articleId, ownerId, userId } =  req.body;
  let responseData = {
    user_id: userId,
    toArticle: {
      like_id: '',
      isLiked: false,
      collect_id: '',
      isCollected: false
    },
    toUser: {
      follow_id: '',
      isFollowed: false
    }
  }
  LikeModel.find({article_id: articleId}).then(list => {
    _.some(list, item => {
      if (item.liker_id.toString() === userId) {
        responseData.toArticle.isLiked = true;
        responseData.toArticle.like_id = item._id;
      }
    });
    CollectModel.find({article_id: articleId}).then(list1 => {
      _.some(list1, item => {
        if (item.collecter_id.toString() === userId) {
          responseData.toArticle.isCollected = true;
          responseData.toArticle.collect_id = item._id;
        }
      })
      FollowModel.find({owner_id: ownerId}).then(list2 => {
        
        _.some(list2, item => { 
          if (item.follower_id.toString() === userId ) {
            responseData.toUser.isFollowed = true;
            responseData.toUser.follow_id = item._id;
          }
        });
        responseClient(res, 200, 'success', responseData);
  
      }).catch(err => {
        responseClient(res, 400, 'success', responseData);
      })
    }).catch(err => {
      responseClient(res, 200, 'success', responseData);
    })
  }).catch(err => {
    responseClient(res, 200, 'success', responseData);
  })
};

// 用户获得的点赞数
exports.userLikes = (req, res) => {
  let { articleId, ownerId, userId } =  req.body;
  let responseData = {
    user_id: userId,
    toArticle: {
      like_id: '',
      isLiked: false,
      follow_id: '',
      isFollowed: false
    },
    toUser: {
      follow_id: '',
      isFollowed: false
    }
  }
  // 查询文章的关注情况
  if (articleId) {
    LikeModel.find({article_id: articleId}).then(list => {

      _.some(list, item => {
        if (item.liker_id === userId) {
          responseData.toArticle.isLiked = true;
          responseData.toArticle.like_id = item._id;
        }
      });
      FollowModel.find({article_id: articleId}).then(list1 => {
        _.some(list1, item => {
          if (item.follower_id === userId) {
            responseData.toArticle.isFollowed = true;
            responseData.toArticle.follow_id = item._id;
          }
        });
        if (ownerId) {
          FollowModel.find({owner_id: ownerId}).then(list2 => {
          
            _.some(list2, item => {
              if (item.follower_id === userId) {
                responseData.toUser.isFollowed = true;
                responseData.toUser.follow_id = item._id;
              }
            });
            responseClient(res, 200, 'success', responseData);
      
          }).catch(err => {
            responseClient(res, 400, 'success', responseData);
          })
        }
      }).catch(err => {
        responseClient(res, 400, 'success', responseData);
      })
  
    }).catch(err => {
      responseClient(res, 400, 'success', responseData);
    })
  } else { //查询关注用户的情况
    FollowModel.find({owner_id: ownerId}).then(list2 => {
          
      responseData.toUser.isFollowed = _.some(list2, item => item.follower_id === userId);
      responseClient(res, 200, 'success', responseData);

    }).catch(err => {
      responseClient(res, 400, 'success', responseData);
    })
  }
};


// 对文章点赞
exports.like = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }

  let { articleId, userId } = req.body;
  let like = new LikeModel({
    article_id: articleId,
    liker_id: userId,
    create_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
  });
  like.save((err, data) => {
    if (err) {
      responseClient(res, 404, '点赞失败', err);
    } else {
      ArticleModel.findOne({_id: articleId})
        .then(result => {
          ArticleModel.updateOne(
            {_id: articleId},
            {like: result.like + 1}
            ).then(() => {
              responseClient(res, 200, '点赞成功');
            })
        })
    }
  })
};


// 对文章取消点赞
exports.unlike = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { articleId, userId } = req.body;
  LikeModel.find({article_id: articleId})
    .then(list => {
      let like_id = '';
      _.some(list, item => {
        if (item.liker_id.toString() === userId) {
          like_id = item._id;
        }
      })
      LikeModel.deleteOne({_id:like_id})
        .then(deleteResult => {
          ArticleModel.findOne({_id: articleId})
            .then(result => {
              ArticleModel.updateOne(
                {_id: articleId},
                {like: result.like - 1}
                ).then(() => {
                  responseClient(res, 200, '已取消点赞', deleteResult);
                })
            })
        }).catch(() => {
          responseClient(res, 400, 'error');
        })
    })
};


// 该用户点过赞的文章列表
exports.likeList = (req, res) => {
  let responseData = {
    likeList: []
  }
  let { userId } = req.body;
  LikeModel.aggregate([
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
      if (item.liker_id.toString() === userId) {
        responseData.likeList.push(item);
      }
    });
    responseClient(res, 200, 'success', responseData);
  })
};

