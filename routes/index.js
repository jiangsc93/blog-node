var article = require('./article');
var tag = require('./tag');
var user = require('./user');
var comment = require('./comment');
var follow = require('./follow');
var collect = require('./collect');
var jiyan = require('./jiyan');
var upload = require('./upload');
var like = require('./like');
var notification = require('./notification');
const verify = require('../util/verify');


module.exports = app => {

  app.post('/api/queryByArea/', article.queryByArea);
  // 前台：读取单个文章详情
  app.post('/api/getArticleOne/', article.getArticleOne);
  // admin 删除文章
  app.post('/api/deleteArticleAdmin/', article.deleteArticleAdmin);
  // admin 编辑新文章
  app.post('/api/editNewArticleAdmin/', article.editNewArticleAdmin);
  // admin 修改原文章
  app.post('/api/modifyArticleAdmin/', article.modifyArticleAdmin);
  // admin 分页获取文章列表
  app.post('/api/getArticleListAdmin/', article.getArticleListAdmin);
  // admin 获取单个文章
  app.post('/api/getArticleOneAdmin/', article.getArticleOneAdmin);
  // 搜索文章
  app.post('/api/search/', article.search);

  // 管理员注册
  app.post('/api/register', user.register);
  // 管理员登录
  app.post('/api/login', user.login);
  // 获取用户信息
  app.post("/api/getUserInfo", user.getUserInfo);
  // 获取作者信息
  app.post("/api/getAuthorInfo", user.getAuthorInfo);
  // 修改用户信息
  app.post("/api/modifyUserInfo", user.modifyUserInfo);
  // 获取管理员列表
  app.post('/api/getUserList', user.getUserList);
  // 删除单个管理员
  app.post('/api/deleteUser', user.deleteUser);
  // 通过邮箱重置密码
  app.post('/api/resetPwdByEmail', user.resetPwdByEmail);
  // 通过邮箱token修改新密码
  app.post('/api/changePwdByEmailToken', user.changePwdByEmailToken);


  // 查询评论列表
  app.post('/api/queryCommentList', comment.queryCommentList);
  // 文章评论
  app.post('/api/commentOne', comment.commentOne);
  // 删除评论
  app.post('/api/deleteComment', comment.deleteComment);
  // 对一级评论点赞
  app.post('/api/commentLike', comment.commentLike);


  // 获取通知列表
  app.post('/api/getUserNotification', notification.getUserNotification);
  
  
  // 关注
  app.post('/api/follow', follow.follow);
  // 取关
  app.post('/api/unfollow', follow.unfollow);
  // 查询用户关注的或被关注列表
  app.post('/api/queryFollowList', follow.queryFollowList);

  // 收藏
  app.post('/api/collect', collect.collect);
  // 取消收藏
  app.post('/api/uncollect', collect.uncollect);
  // 查询收藏列表
  app.post('/api/queryCollectList', collect.queryCollectList);


  // 极验接口
  app.get("/api/gt/register-slide", jiyan.register);
  app.post("/api/gt/validate-slide", jiyan.validate);
  
  
  // 上传图片
  app.post('/upload', upload.upload);
  

  // 当前用户是否点赞、关注（文章、作者）
  app.post('/api/likeAndFollowStatus', like.likeAndFollowStatus);

  // 对文章点赞
  app.post('/api/like', like.like);
  // 对文章取消点赞
  app.post('/api/unlike', like.unlike);
  // 点过赞的文章列表
  app.post('/api/likeList', like.likeList);
}
