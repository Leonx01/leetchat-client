import type { RouteRecordRaw } from 'vue-router'

function Layout() {
    return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
    path: '/Friends',
    component: Layout,
    redirect: '/Friends/index',
    name: 'Friends',
    meta: {
        title: '好友',
        icon: 'mdi:human-hello-variant',
    },
    children: [
        {
            path: 'index',
            name: 'Friends-index',
            component: () => import('@/views/Friends/index.vue'),
            meta: {
                sidebar: false,
                breadcrumb: false,
                activeMenu: '/Friends',
            },
        },
    ],
}

export default routes
