import useSettingsStore from './settings'
import useRouteStore from './route'
import useMenuStore from './menu'
import router from '@/router'
import apiUser from '@/api/modules/user'
import WebSocketAPI from "@/socket";
import {useSignalChannel} from "@/store/modules/signalChannel.ts";
const useUserStore = defineStore(
  // 唯一ID
  'user',
  () => {
      // const webSocket = ref<WebSocketAPI | null>(null)
    const settingsStore = useSettingsStore()
    const routeStore = useRouteStore()
    const menuStore = useMenuStore()
      // const webSocketStore = useWebSocketStore()

      // const globalSocket = ref<WebSocketAPI | null>(null)
      const uid = ref(sessionStorage.uid ?? '')
    const account = ref(sessionStorage.account ?? '')
    const token = ref(sessionStorage.token ?? '')
    const failure_time = ref(sessionStorage.failure_time ?? '')
    const avatar = ref(sessionStorage.avatar ?? '')
    const nickname = ref(sessionStorage.nickname ?? '')
    const permissions = ref<string[]>([])
    const isLogin = computed(() => {
      let retn = false
      if (token.value) {
        if (new Date().getTime() < Number.parseInt(failure_time.value) * 1000) {
          retn = true
        }
      }
      return retn
    })
    // 登录
    async function login(data: {
      account: string
      password: string
    }) {
      const res = await apiUser.login(data)
        sessionStorage.setItem('account', res.data.account)
        sessionStorage.setItem('token', res.data.token)
        sessionStorage.setItem('failure_time', res.data.failure_time)
        sessionStorage.setItem('avatar', res.data.avatar)
        sessionStorage.setItem('uid', res.data.uid)
        const displayName = res.data.unick != null && res.data.unick !== '' ? res.data.unick : res.data.account
        sessionStorage.setItem('nickname', displayName)
        nickname.value = displayName
        uid.value = res.data.uid
      account.value = res.data.account
      token.value = res.data.token
      failure_time.value = res.data.failure_time
      avatar.value = res.data.avatar
        // 连接websocket
        // webSocketStore.connect()
        // globalSocket.value = new WebSocketAPI('/online-status', (data) => {
        //     console.log(data);
        // })
      // const socket = new WebSocketAPI('/online-status', (data) => {
      //   console.log(data);
      // }
      // );
      // const socket = new WebSocket(BASE_URL+`online-status`,[token.value])
      // socket.onopen = function () {
      //   console.log('WebSocket connection established.');
      //   setInterval(
      //     () => {
      //       const Msg = {
      //         type:"heartbeat",
      //       }
      //       socket.send(JSON.stringify(Msg))
      //     }, 5000)
      //   // this.startHeartbeat();
      // }
      // statusSocket.value = socket
        // webSocket.value = new WebSocketAPI('/global', (data) => {
        //   console.log(data);
        // }
        // );
    }
  function setAvatar(newAvatar: string) {
    sessionStorage.setItem('avatar', newAvatar)
    avatar.value = newAvatar
  }
  function setNickname(newNickname: string) {
    sessionStorage.setItem('nickname', newNickname)
    nickname.value = newNickname
  }
    // 登出
    async function logout(redirect = router.currentRoute.value.fullPath) {
        sessionStorage.removeItem('account')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('failure_time')
        sessionStorage.removeItem('avatar')
        sessionStorage.removeItem('nickname')
      account.value = ''
      token.value = ''
      failure_time.value = ''
      avatar.value = ''
      nickname.value = ''
      permissions.value = []
      routeStore.removeRoutes()
      menuStore.setActived(0)
      router.push({
        name: 'login',
        query: {
          ...(router.currentRoute.value.path !== settingsStore.settings.home.fullPath && router.currentRoute.value.name !== 'login' && { redirect }),
        },
      })
    }
    // 获取权限
    async function getPermissions() {
      const res = await apiUser.permission()
      permissions.value = res.data.permissions
      return permissions.value
    }
    // 修改密码
    async function editPassword(data: {
      password: string
      newpassword: string
    }) {
      await apiUser.passwordEdit(data)
    }

    return {
        uid,
        setAvatar,
        setNickname,
      account,
      token,
      avatar,
      nickname,
      permissions,
      isLogin,
      login,
      logout,
      getPermissions,
      editPassword,
    }
  },
)

export default useUserStore
