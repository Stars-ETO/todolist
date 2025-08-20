import api from './api'

// 用户登录
export const login = (username, password) => {
  return api.post('/auth/login', { username, password })
}

// 用户注册
export const register = (username, email, password) => {
  return api.post('/auth/register', { username, email, password })
}

// 获取当前用户信息
export const getCurrentUser = () => {
  return api.get('/users/me')
}

// 更新当前用户信息
export const updateCurrentUser = (userData) => {
  return api.put('/users/me', userData)
}

// 更新个人设置
export const updateProfileSettings = (settings) => {
  return api.put('/settings/profile', settings)
}

// 修改密码
export const changePassword = (passwordData) => {
  return api.put('/settings/password', passwordData)
}

// 删除账户
export const deleteAccount = (password) => {
  return api.delete('/settings/account', { params: { password } })
}

// 管理员功能：获取所有用户（分页）
// 注意：这是前端扩展功能，后端暂未提供对应API
export const getAllUsers = (params) => {
  console.warn('This is a frontend extension feature for admin users management, not a backend API')
  return Promise.resolve({ 
    data: {
      items: [],
      total: 0
    }
  })
}

// 管理员功能：创建用户
// 注意：这是前端扩展功能，后端暂未提供对应API
export const createUser = (userData) => {
  console.warn('This is a frontend extension feature for admin users management, not a backend API')
  return Promise.resolve({ data: {} })
}

// 管理员功能：更新用户
// 注意：这是前端扩展功能，后端暂未提供对应API
export const updateUser = (userId, userData) => {
  console.warn('This is a frontend extension feature for admin users management, not a backend API')
  return Promise.resolve({ data: {} })
}

// 管理员功能：删除用户
// 注意：这是前端扩展功能，后端暂未提供对应API
export const deleteUser = (userId) => {
  console.warn('This is a frontend extension feature for admin users management, not a backend API')
  return Promise.resolve({ data: {} })
}