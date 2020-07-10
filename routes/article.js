const _ = require('lodash');
let moment = require('moment');
let util = require('../util/util');
let articleModel = require('../models/article');
let UserModel = require('../models/user_model');
let CollectModel = require('../models/collect');
let CommentModel = require('../models/comment');
let LikeModel = require('../models/like');
let tagInterface = require('./tag');
const verify = require('../util/verify');
let { responseClient } = util;

//查询标签列表
exports.queryTagList = (req, res) => {
  
}
//查询
exports.queryByArea = (req, res) => {
  let { body } = req;
  let { pageIndex, pageSize, category, tag, order, type, userId } = body.variables;
  if (pageIndex == null) {
    pageIndex = 1;
  }
  if (pageSize == null) {
    pageSize = 20;
  }
  let responseData = {
    hasNextPage: true,
    pageIndex: Number(pageIndex),
    pageSize: Number(pageSize),
  }
  let skip = (responseData.pageIndex - 1) * responseData.pageSize;
  let conditions = {};
  // 待返回的字段
  let fields = {
    _id: 1,
    title: 1,
    author: 1,
    category: 1,
    tag: 1,
    visit: 1,
    uid: 1,
    summary: 1,
    comments_num: 1,
    like: 1,
    imgSrc: 1,
    beginDate: 1,
  };

  let options = {
    skip: skip,
    limit: Number(pageSize),
    sort: { beginDate: -1 },
  };
  let reg_category = new RegExp(category, "i"); // 查文章范畴
  let reg_tag = new RegExp(tag, "i"); // 查文章标签
  let reg_type = new RegExp(type, "i"); // 查类型 是文章还是用户 或其他
  let reg_userId = new RegExp(userId, "i"); // 用户id 查询作者的文章列表
  if (!category) {
    category = 'recommend';
  }
  if (!tag) {
    tag = '全部';
  }
  if (!order) {
    order = 'popular';
  }
  // 判断文章类型
  if (category === 'recommend') {
    let con3 = {
      state: 0
    };
    Object.assign(conditions, con3);

    // 有了标签再判断order
    if (order === 'newest') { // 如果查询为  最新 则 返回最近30天的数据
      let month = Date.now()/1000 - 2 * 24 * 3600;
      let beforeMonth = moment(month * 1000).format('YYYY-MM-DD HH:mm:ss');
      let con2 = {beginDate: {$gte: beforeMonth}, state: 0};
      Object.assign(conditions, con2);
    }
  } else if (category === 'follow') {
    
  } else { // 其他文章类型
    if (tag === '全部') {
      let con5 = {
        category: { $regex: reg_category },
        state: 0
      };
      Object.assign(conditions, con5);

      // 有了标签再判断order
      if (order === 'newest') { // 如果查询为  最新 则 返回最近30天的数据
        let month = Date.now()/1000 - 30 * 24 * 3600;
        let beforeMonth = moment(month * 1000).format('YYYY-MM-DD HH:mm:ss');
        let con2 = {beginDate: {$gte: beforeMonth}, state: 0};
        Object.assign(conditions, con2);
      }
    } else {
      let con6 = {
        category: { $regex: reg_category },
        tag: { $regex: reg_tag },
        state: 0
      };
      Object.assign(conditions, con6);

      // 有了标签再判断order
      if (order === 'newest') { // 如果查询为  最新 则 返回最近30天的数据
        let month = Date.now()/1000 - 2 * 24 * 3600;
        let beforeMonth = moment(month * 1000).format('YYYY-MM-DD HH:mm:ss');
        let con2 = {beginDate: {$gte: beforeMonth}, state: 0};
        Object.assign(conditions, con2);
      }
    }
  }
  if (userId) {
    let con7 = {
      uid: userId, // 用户id
      state: 0
    };
    Object.assign(conditions, con7);
  }
  articleModel.find(conditions, fields, options)
    .then(result => {
      if (result.length < 20) {
        responseData.hasNextPage = false;
      }
      responseData.articleList = result; // 数据包
      // 获取标签只取文章范围字段
      let con111 = {
        category: { $regex: reg_category },
        state: 0
      };
      articleModel.find(con111, fields, options)
        .then(resultList => {
          let arrTag = [];
          let arr = [];
          if (resultList.length > 0) {
            _.forEach(resultList, item => {
              arrTag.push(item.tag);
            })
            arrTag = arrTag.join(',').split(',');
            arr = [...new Set(arrTag)];
          }
          responseData.tagList = arr;
          responseData.count = result.length;
          responseClient(res, 200, 'success', responseData);
        })

    }).catch((err => {
      responseClient(res);
      console.log('error:', err);
    }))
}
// 搜索文章search
exports.search = (req, res) => {
  let { type, keywords, userId } = req.body;
  let responseData = {};
  type = type || 'article';
  if (type === 'article') {
    // 待返回的字段
    let fields = {
      _id: 1,
      title: 1,
      author: 1,
      avatar: 1,
      category: 1,
      uid: 1,
      tag: 1,
      visit: 1,
      beginDate: 1,
      lastDate: 1,
      summary: 1,
      content: 1,
      imgSrc: 1,
      state: 1,
      like: 1,
      comments_num: 1
    };
    let reg = new RegExp(keywords, "i"); // 不区分大小写
    let conditions = { title: { $regex: reg }, state: 0 };
    articleModel.find(conditions, fields).limit(20)
      .then(result => {
        responseData.count = result.length;
        responseData.list = result; // 数据包
        responseClient(res, 200, 'success', responseData);
      }).catch(err => {
        responseClient(res);
        console.log('error:', err);
      })
  } else {
    UserModel.aggregate([
      {
        $lookup:
          {
            from: "follows",
            localField: "_id",
            foreignField: "owner_id",
            as: "follower"
          }
      }
    ], function(err, docs) {
      if (err) {
        console.log(err);
        return;
      }
      let resultList = [];
      _.forEach(docs, item => {
        if ((item.userName ? item.userName.indexOf(keywords) : -1) > -1 || (item.position ? item.position.indexOf(keywords) : -1) > -1) {
          if (item.follower.length === 0) item.isCurentUserFollowed = false;
          _.some(item.follower, i => {
            if (i.follower_id.toString() === userId) {
              item.isCurentUserFollowed = true;
            } else {
              item.isCurentUserFollowed = false;
            }
          })
          resultList.push(item);
        }
      })
      responseData.list = resultList;
      responseClient(res, 200, 'success', responseData);
    })
  }
};

// 前台获取单个文章
exports.getArticleOne = (req, res) => {
  let { body } = req;
  articleModel.findOne({ _id: body.id, state: 0 }).then( result => {
    // 保存浏览次数，每请求一次加一次
    result.visit += 1;
    result.save(function(err, data) {
      if (err) {
        responseClient(res, 404, '没有找到', err);
      } else {
        responseClient(res, 200, 'success', result);
      }
    })
  }).catch(err => {
    responseClient(res, 404, 'error', err);
  })
};

// admin编辑新文章
exports.editNewArticleAdmin = (req, res) => {
  let { title, author, category, userId, tag, summary, beginDate, content, state, imgSrc } = req.body;
  let avatar = '';
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  UserModel.findOne(
    {
      _id: userId,
      userName: author,
    }
  ).then(userInfo => {
    avatar = userInfo._doc.avatar;
    let article = new articleModel({
      title,
      author,
      avatar,
      category,
      uid: userId,
      tag,
      visit: 12,
      beginDate,
      lastDate: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
      summary,
      content,
      imgSrc,
      state,
    });
    // 调用tag的addTag接口
    tagInterface.addTag(tag);
    article.save((err, data) => {
      if (err) {
        responseClient(res, 404, 'error', err);
      } else {
        responseClient(res, 200, 'success', data);
      }
    });
  }).catch(err => {
    console.log('报错');
  })
};

// admin删除单个文章
exports.deleteArticleAdmin = (req, res) => {
  let { token, user_id_t, id } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  articleModel.findById(id, (err, data) => {
    if (err) {
      responseClient(res, 404, '没有查找这篇文章', err);
    } else {
      data.deleteOne((err, result) => {
        if (err) {
          responseClient(res, 404, '删除失败', err);
        } else {
          CollectModel.remove({"article_id": id}).then(() => {
            CommentModel.remove({"article_id": id}).then(() => {
              LikeModel.remove({"article_id": id}).then(() => {
                responseClient(res, 200, '你很叼哦,删除成功了!', result);
              });
            });
          });
          
        }
      });
    }
  });
};

// admin修改单个文章
exports.modifyArticleAdmin = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let avatar = '';
  let { body } = req;
  UserModel.findOne(
    {
      _id: body.userId,
    }
  ).then(userInfo => {
    avatar = userInfo._doc.avatar;
    articleModel.findById(body.id, (err, data) => {
      data.content = body.content;
      data.summary = body.summary;
      data.avatar = avatar;
      data.uid = body.userId;
      data.beginDate = body.beginDate;
      data.lastDate = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
      data.author = body.author;
      data.category = body.category;
      data.tag = body.tag;
      data.title = body.title;
      data.state = body.state;
      data.imgSrc = body.imgSrc;
      // 调用tag的addTag接口
      tagInterface.addTag(body.tag);
      data.save(function(err, data) {
        if (err) {
          responseClient(res, 404, '文章修改失败', err);
        } else {
          responseClient(res, 200, '文章修改成功!', data);
        }
      })
    });
  }).catch(err => {
    console.log('报错');
  })

};


// admin获取单个文章
exports.getArticleOneAdmin = (req, res) => {
  articleModel.findById(req.body.id, (err, data) => {
    if (err) {
      responseClient(res, 404, '获取文章失败', err);
    } else {
      responseClient(res, 200, '你很叼哦,请求成功了!', data);
    }
  });
};

// admin获取分页文章列表
exports.getArticleListAdmin = (req, res) => {
  let { body } = req;
  if (body.pageIndex == null) {
    body.pageIndex = 1;
  }
  if (body.pageSize == null) {
    body.pageSize = 5;
  }

  var resDatas = {
    msg: '请求成功',
    pageIndex: parseInt(body.pageIndex),
    pageSize: parseInt(body.pageSize)
  }


  if (body.author === '益码凭川') {
    // 方法一, 此方法查询参数条件下的数据并返回
    articleModel.countDocuments().then(count => {
      resDatas.records = count; // 数据条数
      resDatas.total = Math.ceil(count/resDatas.pageSize); // 总页数
  
      if (resDatas.pageIndex > resDatas.total) resDatas.pageIndex = resDatas.total;
      var limit = resDatas.pageSize;
      var skip = (resDatas.pageIndex - 1) * resDatas.pageSize;
  
      articleModel.find().sort({_id: -1}).limit(limit).skip(skip)
        .then((data) => {
          resDatas.list = data; // 数据包
          responseClient(res, 200, 'success', resDatas);
        }).catch(err => {
          responseClient(res, 400, '获取失败', err);
        })
    });
  } else {
    let reg = new RegExp(body.author, "i"); // 不区分大小写
    let conditions = { author: { $regex: reg } };
    if (resDatas.pageIndex > resDatas.total) resDatas.pageIndex = resDatas.total;
    let limit = resDatas.pageSize;
    let skip = (resDatas.pageIndex - 1) * resDatas.pageSize;
    articleModel.find(conditions).then(result => {
      resDatas.records = result.length;
    })
    articleModel.find(conditions).sort({_id: -1}).limit(limit).skip(skip)
      .then( data => {
        resDatas.list = data; // 数据包
        responseClient(res, 200, 'success', resDatas);
      }).catch(err => {
        responseClient(res, 400, '获取失败', err);
      })
  }
};

