// setting.js
module.exports = {
  token: {
    // token密钥
      signKey: 'blog_node_ympc_token_key_$token0220',
      // 过期时间
      signTime: 3600 * 24 * 3,
      // 请求头参数
      header: 'authorization',
      // 不用校验的路由
      // unRoute: [
      //     { url: '/login', methods: ['POST']},
      //     { url: '/register', methods: ['POST']}
      // ]
  }
}