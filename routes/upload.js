const _ = require('lodash');
let util = require('../util/util');
let { responseClient } = util;

// 上传图片
exports.upload = (req, res) => {
  var formidable = require("formidable");
  var path = require('path');
  var fs = require("fs");
  const moment = require('moment');
  return new Promise((resolve, reject) => {
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    let pathName = path.resolve(__dirname, '..');
    console.log('888899999999999999');
    let filedr = `/upload`;
    form.uploadDir = path.join(pathName + filedr); // 上传到server下upload文件夹里
    form.keepExtensions = true; // 保留后缀
    form.maxFieldsSize = 2 * 1024 * 1024;
    form.parse(req, function (err, fields, files) {

      var filename = files.file.name;
      var nameArray = filename.split('.');
      var type = nameArray[nameArray.length - 1];
      console.log(type, 'typs');
      var name = '';
      for (var i = 0; i < nameArray.length - 1; i++) {
          name = name + nameArray[i];
      }
      var time = moment(Date.now()).format('YYYYMMDDHHmm');
      var avatarName = '/' + name + '_' + time + '.' + type; // 新命名
      var newPath = form.uploadDir + avatarName; // 新路径
      fs.renameSync(files.file.path, newPath); // 重命名
      // res.send({data:"/upload/"+avatarName})
      let data = {};
      data.name = avatarName;
      data.url = filedr + avatarName;
      resolve(data);
      console.log('888888');
      responseClient(res, 200, '上传图片成功', data);
      return;
    });
  }).then(result => {
    console.log(result, 'result');
    responseClient(res, 200, '上传图片成功', result);

  }).catch(err => {
    responseClient(res, 400, '上传图片失败', err);
  })
};