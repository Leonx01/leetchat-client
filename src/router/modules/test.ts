import type { RouteRecordRaw } from 'vue-router'

function Layout() {
    return import('@/layouts/index.vue')
}

const routes: RouteRecordRaw = {
    path: '/Test',
    component: Layout,
    redirect: '/Test/index',
    name: 'Test',
    meta: {
        title: '测试页面',
        icon: 'simple-icons:speedtest',
    },
    children: [
        {
            path: 'index',
            name: 'Test-index',
            component: () => import('@/views/Test/index.vue'),
            meta: {
                sidebar: false,
                breadcrumb: false,
                activeMenu: '/Test',
            },
        },
    ],
}

export default routes
