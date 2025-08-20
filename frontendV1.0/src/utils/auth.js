// 检查用户是否已认证
export const isAuthenticated = () => {
  return !!localStorage.getItem('token')
}

// 获取 JWT token
export const getToken = () => {
  return localStorage.getItem('token')
}

// 设置 JWT token
export const setToken = (token) => {
  localStorage.setItem('token', token)
}

// 移除 JWT token
export const removeToken = () => {
  localStorage.removeItem('token')
}

// 检查用户是否为管理员
export const isAdmin = () => {
  return localStorage.getItem('isAdmin') === 'true'
}

// 设置管理员状态
export const setAdminStatus = (isAdmin) => {
  localStorage.setItem('isAdmin', isAdmin)
}

// 清除所有认证信息
export const clearAuthInfo = () => {
  removeToken()
  localStorage.removeItem('isAdmin')
}