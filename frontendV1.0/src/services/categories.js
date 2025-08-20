import api from './api'

// 获取分类列表
export const getCategories = (params) => {
  return api.get('/tasks/categories', { params })
}

// 创建分类
export const createCategory = (categoryData) => {
  return api.post('/tasks/categories', categoryData)
}

// 更新分类
export const updateCategory = (categoryId, categoryData) => {
  return api.put(`/tasks/categories/${categoryId}`, categoryData)
}

// 删除分类
export const deleteCategory = (categoryId) => {
  return api.delete(`/tasks/categories/${categoryId}`)
}