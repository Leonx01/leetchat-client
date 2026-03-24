import api from '../index'

export default {
  getUserSetting: () => api.get('/userinfo/detail'),
  uploadAvatar: (data: FormData) => api.post('/avatar/update', data, {
  }),
  updateUserInfo: (data: {
    unick: string
    selfInfo: string
  }) => api.post('/userinfo/update', data, {
  }),
  resetPassword:(data:{
    account:string
    password:string
  })=>api.post('/password/reset',data,{

  }),
  validateResetPassword:(data:{
    account:string
    email:string
    verifyCode:string
  })=>api.post('/password/validate',data,{

  }),
  ResetVerifyCode:(data:{
    account:string
    email:string
  })=>api.post('/password/auth',data,{
  }),
    register:(data:{
    account:string
    email:string
    verifyCode:string
    password:string

  })=>api.post('/user/register',data,{

  }),
  getVerifyCode:(data:{
    email:string
  })=>api.post('/user/authMail',data,{


  }),


  // 登录（后端使用 @RequestParam，需传 application/x-www-form-urlencoded）
  login: (data: {
    account: string
    password: string
  }) => api.post('/user/login', new URLSearchParams({
    account: data.account,
    password: data.password,
  }), {}),

  // 获取权限
  permission: () => api.get('user/permission', {
    baseURL: '/mock/',
  }),

  // 修改密码
  passwordEdit: (data: {
    password: string
    newpassword: string
  }) => api.post('user/password/edit', data, {
    baseURL: '/mock/',
  }),
  getUserInfo:(
      uid: string) =>
    api.get('/userinfo', {
      params: {
        uid
      },
      // baseURL: '/mock/',
    })
}
