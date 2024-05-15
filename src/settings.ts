import { defaultsDeep } from 'lodash-es'
import type { RecursiveRequired, Settings } from '#/global'
import settingsDefault from '@/settings.default'

const globalSettings: Settings.all =
    {
        "app": {
            "colorScheme": "dark",
            "enablePermission": true,
            "enableDynamicTitle": true
        },
        "home": {
            "enable": false
        },
        "menu": {
            "menuMode": "head",
            "subMenuCollapse": true
        },
        // "copyright": {
        //     "enable": true,
        //     "dates": "2024",
        //     "company": "nileonx"
        // },
        "toolbar":{
        //     <NavSearch v-if="settingsStore.settings.toolbar.navSearch" />
        // <Fullscreen v-if="settingsStore.settings.toolbar.fullscreen" />
        // <PageReload v-if="settingsStore.settings.toolbar.pageReload" />
        // <ColorScheme v-if="settingsStore.settings.toolbar.colorScheme" />
        //     "navSearch": true,
            "fullscreen": true,
            "pageReload": true,
            // "colorScheme": true,
            "breadcrumb": false,
        }
    }
export default defaultsDeep(globalSettings, settingsDefault) as RecursiveRequired<Settings.all>
