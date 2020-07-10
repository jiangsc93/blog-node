const _ = require('lodash');
const moment = require('moment');
// 引入email 模块
let UserModel = require('../models/user_model');
let TokenModel = require('../models/token_model');
let CollectModel = require('../models/collect');
let FollowModel = require('../models/follow');
let CommentModel = require('../models/comment');
let ArticleModel = require('../models/article');
let LikeModel = require('../models/like');
let util = require('../util/util');
let { responseClient, md5, MD5_SALT } = util;
const verify = require('../util/verify');
const setting = require('../util/setting');
const jwt = require('jwt-simple');
const Email = require('../util/email');

// 登录
exports.login = (req, res) => {
  let { password, email } = req.body;
  UserModel.findOne(
    {
      email,
      password,
    }
  ).then(userInfo => {

    if (userInfo) { // 用户存在
      let Token = verify.makeToken(userInfo._id);
      let responseData = {
        token: Token,
      };
      let { _id, userName, email, avatar, create_time } = userInfo;
      responseData.userInfo = { _id, userName, email, avatar, create_time };
      responseClient(res, 200, 'success', responseData);
    } else {
      responseClient(res, 200, '账号或密码错误！', 'error');
    }
  }).catch(err => {
    responseClient(res, 400, 'error', err);
  })
};



// 注册
exports.register = (req, res) => {
  
  let { email, password, create_time } = req.body;
  // 后台需再次对注册信息进行验证
  const reg = new RegExp(
    '^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$',
  );
  if (!reg.test(email)) {
    responseClient(res, 400, '邮箱格式错误，无法通过！');
    return;
  }
  if (!password) {
    responseClient(res, 400, '密码不可为空');
    return;
  }
  UserModel.findOne(
    {
      email: email
    }
  ).then(userInfo => {
    if (userInfo) { // 用户存在
      responseClient(res, 200, '用户邮箱已存在');
    } else {
      let userModel = new UserModel({
        email: email,
        password: password,
        avatar: 'http://www.jscwwd.com:3000/upload/avatar_202006141544.png',
        create_time: create_time || moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
        update_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
      })
      userModel.save().then(data => {
        let { _id, userName, email, avatar, create_time } = data;
        let Token = verify.makeToken(_id);
        let responseData = {
          token: Token,
        };
        responseData.userInfo = { _id, userName, email, avatar, create_time };
        responseClient(res, 200, '注册成功', responseData);
      }).catch(err => {
        responseClient(res, 400, 'error', err);
      });
    }
  }).catch(err => {
    responseClient(res, 400, 'error', err);
  })
};


// 发送邮箱重置密码连接
exports.resetPwdByEmail = (req, res) => {
  
  let { email } = req.body;
  // 后台需再次对注册信息进行验证
  const reg = new RegExp(
    '^[a-z0-9]+([._\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$',
  );
  if (!reg.test(email)) {
    responseClient(res, 400, '邮箱格式错误！', '邮箱格式错误');
    return;
  }
  UserModel.findOne(
    {
      email: email
    }
  ).then(userInfo => {
    if (!userInfo.email) { // 用户不存在
      responseClient(res, 200, '用户邮箱不存在', 'nonexistence');
    } else {
      let emailList = [];
      emailList.push(email);
      let Token = verify.makeToken(userInfo._id);
      let htmlDiv = `<div style="position: relative;margin: 10px 5px 20px;box-shadow: 0px 1px 6px #eee;font-size: 13px;">
        <div style="text-align: center;font-weight: bolder;padding: 20px 0 15px; color: #5f9ea0;border-bottom: 1px solid #ccc;">
          <span style="display: inline-block;font-size:24px;margin-right: 10px;">知否</span> <span>一个开发者分享知识的平台</span>
        </div>
        <div style="padding: 30px 40px 20px">
          <div style="font-weight: bolder;line-height: 2;">Hi: ${userInfo.userName}</div>
          <div style="line-height: 22px;">您要求重新设置知否网站的密码，请点击下方链接重设密码（24小时内有效）：</div>
          <div style="padding: 8px 0;">
            <a href="http://www.jscwwd.com/set-new-password?token=${Token}" target="_blank" style="line-height: 18px;">http://www.jscwwd.com/set-new-password?token=${Token}</a>
          </div>
          <div style="line-height: 22px;">如果无法打开该链接，请复制链接地址到浏览器中打开。</div>
          <p style="padding-top: 10px;font-size:15px;">知否团队</p>
        </div>
      </div>`;
      Email.sendEmail(emailList, htmlDiv);
      responseClient(res, 200, '已发送，请前往邮箱', 'success');
    }
  }).catch(err => {
    responseClient(res, 200, '用户邮箱不存在', 'nonexistence');
  })
};


// 通过邮箱token修改密码
exports.changePwdByEmailToken = (req, res) => {
  
  let { emailToken, newPwd } = req.body;
  let { isExpired, msg, userId } = verify.validateEmailTokenReturn(emailToken);
  // 对emailToken解密获取邮箱
  if (!isExpired) {
    UserModel.findOne(
      { _id: userId }
    ).then(userInfo => {
      if (userInfo) { // 用户存在
        UserModel.updateOne(
          { _id: userId },
          {
            password: newPwd,
            update_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
          }).then(updateResult => {
            responseClient(res, 200, msg, updateResult);
          }).catch( err => {
            console.error(err);
            responseClient(res, 400, '用户密码重新设置失败');
          })
        
      } else {
        responseClient(res, 200, '此用户不存在', 'noUser');
      }
    }).catch(err => {
      responseClient(res, 200, '此用户不存在', 'noUser');
    })
  }
};


// 获取作者信息
exports.getAuthorInfo = (req, res, next) => {
  let { _id } = req.body;
  UserModel.findOne(
    {
      _id,
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
      totalVisits: 1,
      totalLikes: 1,
      create_time: 1
    }
  ).then(userInfo => {
    if (userInfo) { // 用户存在
      ArticleModel.find({uid: _id})
        .then(result => {
          userInfo.articleNum = result.length || 0;
          let totalLikes = 0;
          let totalVisits = 0;
          _.forEach(result, item => {
            totalLikes += Number(item.like);
            totalVisits += Number(item.visit);
          })
          userInfo.totalLikes = totalLikes || 0;
          userInfo.totalVisits = totalVisits || 0;
          // 关注数量
          FollowModel.find({follower_id: _id})
            .then(followResult => {
              let followings = _.filter(followResult, item => item.owner_id).length;
              let collectArticles = _.filter(followResult, item => item.article_id).length;
              userInfo.followings = followings || 0;
              userInfo.collectArticles = collectArticles || 0;
              FollowModel.find({owner_id: _id})
                .then(followResult2 => {
                  userInfo.followers = followResult2.length || 0;
                  responseClient(res, 200, 'success', userInfo);
                })
            })
        })
    } else {
      responseClient(res, 200, '此用户不存在');
    }
  }).catch(err => {
    responseClient(res, 400, 'error', err);
  })
};

// 获取用户信息
exports.getUserInfo = (req, res, next) => {
  let { _id } = req.body;
  UserModel.findOne(
    {
      _id,
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
      totalVisits: 1,
      totalLikes: 1,
      create_time: 1
    }
  ).then(userInfo => {
    if (userInfo) { // 用户存在

      ArticleModel.find({uid: _id})
        .then(result => {
          userInfo.articleNum = result.length || 0;
          let totalLikes = 0;
          let totalVisits = 0;
          _.forEach(result, item => {
            totalLikes += Number(item.like);
            totalVisits += Number(item.visit);
          })
          userInfo.totalLikes = totalLikes || 0;
          userInfo.totalVisits = totalVisits || 0;
          // 关注数量
          FollowModel.find({follower_id: _id})
            .then(followResult => {
              let followings = _.filter(followResult, item => item.owner_id).length;
              let collectArticles = _.filter(followResult, item => item.article_id).length;
              userInfo.followings = followings || 0;
              userInfo.collectArticles = collectArticles || 0;
              FollowModel.find({owner_id: _id})
                .then(followResult2 => {
                  userInfo.followers = followResult2.length || 0;
                  responseClient(res, 200, 'success', userInfo);
                })
            })
        })
    } else {
      responseClient(res, 200, '此用户不存在');
    }
  }).catch(err => {
    responseClient(res, 400, 'error', err);
  })
};


// 修改用户信息
exports.modifyUserInfo = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { _id, email, userName, company, position, homePage, oldPwd, newPwd, introduce, avatar } = req.body;
  UserModel.findOne(
    { _id }
  ).then(userInfo => {
    if (userInfo) { // 用户存在
      let responseData = {
        isModefied: false
      };
      if (oldPwd && oldPwd !== userInfo.password) { // 修改密码 比较原密码是否同数据库的一致
        responseData.isModefied = false;
        responseClient(res, 200, '当前原密码错误', responseData);
      }
      if (oldPwd) {
        UserModel.updateOne(
          { _id },
          {
            newPwd,
            update_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
          }).then(updateResult => {
            responseData.isModefied = true;
            responseClient(res, 200, 'success', responseData);
          }).catch( err => {
            console.error(err);
            responseClient(res, 400, '用户资料修改失败');
          })
      } else {
        UserModel.updateOne(
          { _id },
          {
            userName,
            email,
            introduce,
            company,
            position,
            avatar,
            homePage,
            update_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
          }).then(updateResult => {
            responseClient(res, 200, 'success', updateResult);
          }).catch( err => {
            console.error(err);
            responseClient(res, 400, '用户资料修改失败');
          })
      }
    } else {
      responseClient(res, 200, '此用户不存在');
    }
  }).catch(err => {
    responseClient(res, 400, 'error', err);
  })
};

// admin获取分页管理员列表
exports.getUserList = (req, res) => {
  let { pageIndex, pageSize, order, userId } = req.body;
  if (pageIndex == null) {
    pageIndex = 1;
  }
  if (pageSize == null) {
    pageSize = 5;
  }
  
  // let conditions = {};

  // let con1 = { level: {$gte: 2}};
  // if (order === 'best') {
  //   pageSize = 3;
  //   Object.assign(conditions, con1);
  // }
  let responseData = {
    hasNextPage: false,
    pageIndex: parseInt(pageIndex),
    pageSize: parseInt(pageSize)
  }

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
      if (item.follower.length === 0) item.isCurentUserFollowed = false;
      _.some(item.follower, i => {
        if (i.follower_id.toString() === userId) {
          item.isCurentUserFollowed = true;
        } else {
          item.isCurentUserFollowed = false;
        }
      })
      resultList.push(item);
    })
    responseData.list = resultList;
    responseClient(res, 200, 'success', responseData);
  })

  // let fields = {
  //   _id: 1,
  //   userName: 1,
  //   create_time: 1,
  //   email: 1,
  //   avatar: 1,
  //   position: 1,
  //   company: 1,
  //   level: 1,
  //   like: 1,
  //   totalLikes: 1,
  //   totalVisits: 1,
  //   introduce: 1,
  // };
  // // 方法一, 此方法查询参数条件下的数据并返回
  // UserModel.countDocuments().then(count => {
  //   resDatas.records = count; // 数据条数
  //   resDatas.total = Math.ceil(count/resDatas.pageSize); // 总页数

  //   if (resDatas.pageIndex > resDatas.total) resDatas.pageIndex = resDatas.total;
  //   var limit = resDatas.pageSize;
  //   var skip = (resDatas.pageIndex - 1) * resDatas.pageSize;
  //   UserModel.find(conditions, fields).sort({_id: -1}).limit(limit).skip(skip)
  //     .then((data) => {
  //       resDatas.list = data; // 数据包
  //       responseClient(res, 200, 'success', resDatas);
  //     }).catch(err => {
  //       responseClient(res, 400, '获取失败', err);
  //     })
  // });
};

// admin删除单个管理员
exports.deleteUser = (req, res) => {
  let { id } = req.body;
  UserModel.findById(id, (err, data) => {
    if (err) {
      responseClient(res, 404, '没有找到这个用户', err);
    } else {
      data.deleteOne((err, result) => {
        if (err) {
          responseClient(res, 404, '删除失败', err);
        } else {
          // 关注
          FollowModel.remove({"owner_id": id}).then(() => {
            FollowModel.remove({"follower_id": id}).then(() => {
              // 文章
              ArticleModel.remove({"uid": id}).then(() => {
                // 评论
                CommentModel.remove({"owner_id": id}).then(() => {
                  CommentModel.remove({"replier_id": id}).then(() => {
                    // 文章点赞
                    LikeModel.remove({"owner_id": id}).then(() => {
                      LikeModel.remove({"liker_id": id}).then(() => {
                        CollectModel.remove({"collecter_id": id}).then(() => {
                          responseClient(res, 200, '你很叼哦,删除成功了!', result);
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        }
      });
    }
  });
};