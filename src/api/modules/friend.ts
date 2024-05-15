import api from '../index'

export default {
    getFriendList:(
    ) =>
        api.get('/friends', {
          }),
    getFriendRequest:() =>
        api.get('/friendRequests', {
        }),
    sendRequest:(
    uname:string
    )=>api.get('/friendRequest',{
        params:{
            uname
        },
    }),
    acceptFriendReq(uname: string) {
        return api.get('/friendRequest/accept', {
          params: {
            uname
          }
        })
    },
    rejectFriendReq(uname: string) {
        return api.get('/friendRequest/reject', {
         params:{   uname}
        })
    },
}
