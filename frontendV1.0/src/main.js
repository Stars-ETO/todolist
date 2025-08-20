import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// 创建 Vue 应用实例
const app = createApp(App)

// 使用 Element Plus
app.use(ElementPlus)

// 使用 Vuex 状态管理和 Vue Router
app.use(store)
app.use(router)

// 挂载应用到 DOM
app.mount('#app')