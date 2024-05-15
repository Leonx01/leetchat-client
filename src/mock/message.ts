import { defineFakeRoute } from 'vite-plugin-fake-server/client'
import Mock from 'mockjs'
export default defineFakeRoute([{
    url: '/mock/window/private',
    method: 'get',
    response: () => {
        return {
            error: '',
            status: 1,
            data: Mock.mock({
                'windows|100': [{
                    'wid|+1': 1,
                    'lastactivetime': '@datetime',
                    'active|1': [0, 1],
                    'uid': '@id',
                    'unick': '@cname',
                    'avatar': '@image(120x120)',
                    'online|1': [0, 1],

                }]
            })
        }
    }
},{
    url: '/mock/message/private',
    method: 'get',
    response: () => {
        return {
            error: '',
            status: 1,
            data: Mock.mock({
                'messages|20': [{
                    'mid|+1': 1,
                    'from': {
                        'uid': '@id',
                        'uname': '@cname',
                        'avatar': '@image(120x120)',
                    },
                    'fromMessage': {
                        'type|1': ['file', 'image', 'text'],
                        'meta': {
                            'name': '@csentence',
                            'size': '1kb',
                            'content': '@image(120x120)',
                            'time': '@datetime',
                            'resp|3': [{
                                'emoji|1': ['😀', '🚀', '📕'],
                                'count|1-100': 1,
                            }],
                        }
                    },
                    'to': {
                        'uid': '@id',
                        'uname': '@cname',
                        'avatar': '@image(120x120)',
                    },
                    'toMessage': {
                        'type|1':  ['file', 'image', 'text'],
                        'meta': {
                            'name': '@csentence',
                            'size': '1kb',
                            'content': '@image(120x120)',
                            'time': '@datetime',
                            'resp|3': [{
                                'emoji|1': ['😀', '🚀', '📕'],
                                'count|1-100': 1,
                            }],
                        }
                    },
                }]
            })
        }
    }
}

])
