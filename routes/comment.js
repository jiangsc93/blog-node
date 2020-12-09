const _ = require('lodash');
let moment = require('moment');
let util = require('../util/util');
let ArticleModel = require('../models/article');
let CommentModel = require('../models/comment');
let UserModel = require('../models/user_model');
const verify = require('../util/verify');
let { responseClient, inputCheck } = util;


// 添加评论
exports.commentOne = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { type, article_id, owner_id, replier_id, comment_id, content } = req.body;
  if (!inputCheck(content).checkResult) {
    responseClient(res, 400, '内容违规：' + inputCheck(content).badWords);
  }
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
        UserModel.findOne(
          {
            _id: replier_id,
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
            if (type === 'one') { // 一级评论
              let Comment = new CommentModel({
                article_id: article_id,
                content: content,
                owner_id: owner_id,
                replier_id: replier_id,
                owner_info: result1,
                replier_info: result2,
                like: 0,
                create_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
              });
              // 保存到评论表里
              Comment
                .save()
                .then(commentResult => {
                  ArticleModel.findOne({ _id: article_id }, (errors, data) => {
                    if (errors) {
                      console.error('Error:' + errors);
                    } else {
                      data.comments_num = data.comments_num + 1;
                      ArticleModel.updateOne(
                        { _id: article_id },
                        { comments_num: data.comments_num },
                      ).then(() => {
                          responseClient(res, 200, 'success', commentResult);
                        })
                        .catch(err => {
                          console.error('err :', err);
                          throw err;
                        });
                    }
                  });
                })
            } else { // 二级或三级评论
              // 首先在评论表里找到这条评论
              CommentModel.findOne({ _id: comment_id }, (errors, data) => {
                if (errors) {
                  console.error('Error:' + errors);
                } else {
                  let children = data.children || [];
                  let Object = {
                    owner_id,
                    replier_id,
                    content,
                    owner_info: result1,
                    replier_info: result2,
                    create_time: moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
                  }
                  children.push(Object);
                  CommentModel.updateOne(
                    { _id: comment_id },
                    { children }
                  ).then(updateResult => {
                    ArticleModel.findOne({ _id: article_id }, (errors, data1) => {
                      if (errors) {
                        console.error('Error:' + errors);
                      } else {
                        data1.comments_num = data1.comments_num + 1;
                        ArticleModel.updateOne(
                          { _id: article_id },
                          { comments_num: data1.comments_num },
                        ).then(result => {
                            responseClient(res, 200, 'success', updateResult);
                          })
                          .catch(err => {
                            console.error('err :', err);
                            throw err;
                          });
                      }
                    });
                  })
                }
              })
            }
          }
        })
    } else {
      responseClient(res, 200, '此用户不存在');
    }
  })
};

// 对一级评论点赞
exports.commentLike = (req, res) => {
  let { comment_id } = req.body;
  CommentModel.findOne({_id: comment_id}, (err, data) => {
    if (err) {
      responseClient(res, 200, 'error', err);
      return;
    }
    _.cloneDeep(data);
    data.like = Number(data.like ? data.like : 0);
    data.like += 1;
    CommentModel.update(
        {_id: comment_id},
        {like: data.like}
      ).then(result => {
        responseClient(res, 200, 'success', result);
      }).catch(err => {
        responseClient(res, 200, 'error', err);
      })
  }).catch(err => {
    responseClient(res, 200, 'error', err);
  })
}


// 删除评论
exports.deleteComment = (req, res) => {
  let { token, user_id_t } = req.body;
  if (!verify.validate(token, user_id_t)) {
    responseClient(res, 401, '非法访问');
  }
  let { comment_id, secondary_comment_index } = req.body;
  if (secondary_comment_index) {
    CommentModel.findOne({ _id: comment_id }, (errors, data) => {
      if (errors) {
        console.error('Error:' + errors);
      } else {
        let children = data.children || [];
        children.splice(secondary_comment_index, 1);
        CommentModel.updateOne(
          { _id: comment_id },
          { children }
        ).then(updateResult => {
          ArticleModel.findOne({ _id: data.article_id }, (errors, data1) => {
            if (errors) {
              console.error('Error:' + errors);
            } else {
              data1.comments_num -= 1;
              ArticleModel.updateOne(
                { _id: data.article_id },
                { comments_num: data1.comments_num },
              ).then(result => {
                  responseClient(res, 200, 'success', updateResult);
                })
                .catch(err => {
                  console.error('err :', err);
                  throw err;
                });
            }
          });
        })
      }
    })
  } else {
    CommentModel.findOne({ _id: comment_id }, (errors, data0) => {
      if (errors) {
        console.error('Error:' + errors);
      } else {
        CommentModel.deleteOne({ _id: comment_id }, (errors, data) => {
          if (errors) {
            responseClient(res, 400, 'error');
          } else {
            ArticleModel.findOne({ _id: data0.article_id }, (errors, data1) => {
              if (errors) {
                console.error('Error:' + errors);
              } else {
                data1.comments_num -= 1;
                ArticleModel.updateOne(
                  { _id: data0.article_id },
                  { comments_num: data1.comments_num },
                ).then(result => {
                    responseClient(res, 200, 'success');
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
  }
}


// 按条件  获取该篇文章的所有评论
exports.queryCommentList = (req, res) => {
  let { pageIndex, pageSize, article_id } = req.body;
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
  }
  let skip = (responseData.pageIndex - 1) * responseData.pageSize;
  let conditions = { article_id };
  // 待返回的字段
  let fields = {
    _id: 1,
    article_id: 1,
    content: 1,
    like: 1,
    create_time: 1,
    owner_id: 1,
    owner_info: 1,
    replier_id: 1,
    replier_info: 1,
    children: 1,
  };

  let options = {
    skip: skip,
    limit: Number(pageSize),
    sort: { create_time: -1 },
  };
  CommentModel.find(conditions, fields, options)
    .then(result => {
      responseData.commentList = result;
      responseData.hasNextPage = result.length < 5 ? false : true;
      responseClient(res, 200, 'success', responseData);
    })
}



