import type { RouteRecordRaw } from 'vue-router'

function Layout() {
    return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
    path: '/MailBox',
    component: Layout,
    redirect: '/MailBox/index',
    name: 'MailBox',
    meta: {
        title: '私信',
        icon: 'clarity:email-solid',
    },
    children: [
        {
            path: 'index',
            name: 'MailBox-index',
            component: () => import('@/views/MailBox/index.vue'),
            meta: {
                sidebar: false,
                breadcrumb: false,
                activeMenu: '/MailBox',
            },
        },
        {
            path: 'chatroom',
            name: 'chatroom',
            component: () => import('@/views/MailBox/videoRTC/index.vue'),
            meta: {
                sidebar: false,
                breadcrumb: false,
                activeMenu: '/MailBox',
            },
        },
    ],
}

export default routes
