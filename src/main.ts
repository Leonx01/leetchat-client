import '@/utils/baidu'

import '@/utils/system.copyright'

import FloatingVue from 'floating-vue'
import 'floating-vue/dist/style.css'

import Message from 'vue-m-message'
import 'vue-m-message/dist/style.css'

import 'overlayscrollbars/overlayscrollbars.css'

import App from './App.vue'
import pinia from './store'
import router from './router'
import ui from './ui-provider'

// 自定义指令
import directive from '@/utils/directive'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 加载 svg 图标
import 'virtual:svg-icons-register'
// 加载 iconify 图标
import { downloadAndInstall } from '@/iconify'
import icons from '@/iconify/index.json'

import 'virtual:uno.css'
// import { MarkdownPreview } from '@/vue-meditor'
// 全局样式
import '@/assets/styles/globals.scss'
import { Icon } from '@iconify/vue';

const app = createApp(App)
app.use(FloatingVue, {
  distance: 12,
})

// import 'vue3-video-play/dist/style.css' // 引入css
// import vue3videoPlay from 'vue3-video-play' // 引入组件
// app.use(vue3videoPlay);
app.use(Message)
app.use(pinia)
app.use(router)
app.use(ui)
app.use(ElementPlus)
app.use(Icon)
// app.use(MarkdownPreview)
directive(app)
if (icons.isOfflineUse) {
  for (const info of icons.collections) {
    downloadAndInstall(info)
  }
}

app.mount('#app')

// 全局注册
// import with ES6
