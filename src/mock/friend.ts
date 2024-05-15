import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import Mock from 'mockjs'
export default defineFakeRoute([{
    url: '/mock/friends',
    method: 'get',
    response: () => {
        return {
            error: '',
            status: 1,
            data: Mock.mock({
                'friends|20': [{
                    'uid|+1': 1,
                    'uname':'@name',
                    'unick': '@cname',
                    'avatar': '@image(120x120)',
                    'online|1': [0, 1],
                }]
            })
        }
    }
},{
    url:'/mock/friendRequests',
    method:'get',
    response:()=>{
        return {
            error:'',
            status:1,
            data:Mock.mock({
                'friendRequests|20':[{
                    'uid|+1':1,
                    'uname':'@name',
                    'unick':'@cname',
                    'avatar':'@image(120x120)',
                    'status':[0,1],
                }]
            })
        }
    }
}
])
