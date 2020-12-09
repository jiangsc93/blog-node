// verify.js
let jwt = require('jwt-simple');
//秘钥
let secret = "jsc3991";
let tokenExpiresTime = 1000 * 60 * 60 * 24 * 1; // token过期时间,毫秒为单位
module.exports = {
    validateEmailTokenReturn(token) {
        let decodeToken = null;
        decodeToken = jwt.decode(token, secret);
        let returnObj = {
            isExpired: true,
            msg: '当前链接无效或已过期，请重新发送邮箱链接！'
        }
        // 如果现在的时间小于过期的时间，则证明token有效
        if (new Date().getTime() < decodeToken.exp) {
            returnObj.isExpired = false;
            returnObj.userId = decodeToken.userId,
            returnObj.msg = 'success';
        }
        return returnObj;
    },
    /*
    *检验token合法性
    */
    validate(token, userId) {
        if (token) { 
            let decodeToken = null;
            try { 
                //防止假冒token解析報錯 
                // decodeToken = jwt.decode(token,secret,'HS256'); 
                decodeToken = jwt.decode(token, secret);  //解密
            } catch (err) { 
                return false; 
            }
            if (decodeToken.userId === userId) return true;
            let exp = decodeToken.exp; 
            if (!exp) {
                return false;
            }
        
        } else { 
            return false;
        }
    },
    /* 生成token*/ 
    makeToken(userId) {
        let Token = null;
        // 需要加密的对象
        let payload = {
            userId: userId,
            time: new Date().getTime(),
            exp: new Date().getTime() + tokenExpiresTime
        };
        Token = jwt.encode(payload, secret); //加密
        return Token;
    }
 }