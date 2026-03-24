import api from '../index'
export default {
   getPrivateWindows:(
   ) =>
       api.get('/windows', {
         }),
    getPrivateMessages:(
        wid: string,
        page?: number,
        size?: number
    ) =>
        api.get('/messages', {
            params: {
                wid,
                page,
                size
            },
        }),
    activateWindow:(
        uname:string
    )=>api.get('/window',{
        params:{
            uname
        },
    }),
    closeWindow:(
        wid:string
    )=>api.get('/window/close',{
        params:{
            wid
        },
    }),
    markWindowRead: (wid: string | number) =>
        api.put('/window/read', null, { params: { wid } }),
}
