import api from '../index'

export default {
    // 后端获取路由数据
    uploadFile: (
     data:FormData
    ) => api.post('/file', data),

    // 基于文件系统路由模式下，后端获取导航菜单数据
    downloadFile: () => api.get('app/menu/list', {
        baseURL: '/mock/',
    }),
    getPreviewUrl:
        (downloadKey: string) =>
            api.get(`/fileUrl`,{
                params:{
                    downloadKey
                }
            }),
}
