import api from '../index'
export default {
   getPrivateWindows:(
   ) =>
       api.get('/windows', {
         }),
    getPrivateMessages:(
        // uid: string,
        wid: string
    ) =>
        api.get('/messages', {
            params: {
                // uid,
                wid
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
}
