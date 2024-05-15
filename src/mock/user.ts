import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import Mock from 'mockjs'

export default defineFakeRoute([
  {
    url:'/mock/user/',
    method:'get',
    response:()=>{
      return {
        error:'',
        status:1,
        data:Mock.mock({
          'uid|1-100':1,
          'uname':'@cname',
          'unick':'@name',
          'email':'@email',
          'pronoun':'@word',
          'avatar':'https://p5.itc.cn/images01/20200609/feaf7849b5c84c5a96235381ae83c6f1.png',
          'online|1':[0,1],
          'selfinfo':'@csentence',
          'createtime':'@datetime',
        })
      }
    }
  },
  {
    url: '/mock/user/login',
    method: 'post',
    response: ({ body }) => {
      return {
        error: '',
        status: 1,
        data: Mock.mock({
          account: body.account,
          token: `${body.account}_@string`,
          failure_time: Math.ceil(new Date().getTime() / 1000) + 24 * 60 * 60,
          avatar: '',
        }),
      }
    },
  },
  {
    url: '/mock/user/permission',
    method: 'get',
    response: ({ headers }) => {
      let permissions: string[] = []
      if (headers.token?.indexOf('admin') === 0) {
        permissions = [
          'permission.browse',
          'permission.create',
          'permission.edit',
          'permission.remove',
        ]
      }
      else if (headers.token?.indexOf('test') === 0) {
        permissions = [
          'permission.browse',
        ]
      }
      return {
        error: '',
        status: 1,
        data: {
          permissions,
        },
      }
    },
  },
  {
    url: '/mock/user/password/edit',
    method: 'post',
    response: () => {
      return {
        error: '',
        status: 1,
        data: {
          isSuccess: true,
        },
      }
    },
  },
])
