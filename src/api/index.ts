import axios from 'axios'

// 封装了axios的请求，返回重新封装的数据格式
// import qs from 'qs'
import Message from 'vue-m-message'
import useUserStore from '@/store/modules/user'

const api = axios.create({
    baseURL: (import.meta.env.DEV && import.meta.env.VITE_OPEN_PROXY === 'true') ? '/api' : import.meta.env.VITE_APP_API_BASEURL,
    timeout: 1000 * 60,
    responseType: 'json',
})

api.interceptors.request.use(
    (request) => {
        // 全局拦截请求发送前提交的参数
        const userStore = useUserStore()
        // 设置请求头
        if (request.headers) {
            if (userStore.isLogin) {
                request.headers.Token = userStore.token
            }
        }
        // ElMessage.success(api.getUri())
        // POST：按数据类型设置 Content-Type，避免 415
        if (request.method === 'post') {
            if (request.data instanceof FormData) {
                // FormData 不设置 Content-Type，由浏览器自动带 boundary
                delete request.headers['Content-Type']
            } else if (request.data instanceof URLSearchParams) {
                // 表单参数（如登录 account/password），由 axios 自动设为 application/x-www-form-urlencoded
                delete request.headers['Content-Type']
            } else {
                request.headers['Content-Type'] = 'application/json; charset=UTF-8'
                if (request.data && typeof request.data === 'object' && !(request.data instanceof FormData)) {
                    request.data = JSON.stringify(request.data)
                }
            }
        }
        return request
    },
)

api.interceptors.response.use(
    (response) => {
        /**
         * 全局拦截请求发送后返回的数据，如果数据有报错则在这做全局的错误提示
         * 假设返回数据格式为：{ status: 1, error: '', data: '' }
         * 规则是当 status 为 1 时表示请求成功，为 0 时表示接口需要登录或者登录状态失效，需要重新登录
         * 请求出错时 error 会返回错误信息
         */
        if (response.data.status === 1) {
            if (response.data.error !== '') {
                // 错误提示
                Message.error(response.data.error, {
                    zIndex: 2000,
                })
                return Promise.reject(response.data)
            }
        }
        // else {
        //   useUserStore().logout()
        // }
        return Promise.resolve(response.data)
    },
    (error) => {
        let message = error.message
        if (message === 'Network Error') {
            message = '后端网络故障'
        }
        else if (message.includes('timeout')) {
            message = '接口请求超时'
        }
        else if (message.includes('Request failed with status code')) {
            message = `接口${message.substr(message.length - 3)}异常`
        }
        Message.error(message, {
            zIndex: 2000,
        })
        return Promise.reject(error)
    },
)
export default api
