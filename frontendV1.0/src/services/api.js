import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api', // 使用 Vite 代理
  timeout: 10000
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response
  },
  error => {
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          // token 过期或无效，清除本地存储并跳转到登录页
          localStorage.removeItem('token')
          localStorage.removeItem('isAdmin')
          // 只有在浏览器环境中才重定向
          if (typeof window !== 'undefined') {
            window.location.href = '/login'
          }
          break
        case 403:
          console.warn('权限不足，请联系管理员')
          break
        case 500:
          console.error('服务器内部错误，请稍后重试')
          break
        default:
          console.error(`请求失败 (${status}): ${error.message}`)
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误: 无法连接到服务器')
    } else {
      // 其他错误
      console.error('请求错误:', error.message)
    }
    return Promise.reject(error)
  }
)

export default api