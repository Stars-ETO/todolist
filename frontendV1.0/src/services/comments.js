import api from './api'

// 获取评论列表
export const getComments = (params) => {
  return api.get('/comments/', { params })
}

// 获取特定评论
export const getComment = (commentId) => {
  return api.get(`/comments/${commentId}`)
}

// 创建评论
export const createComment = (commentData) => {
  return api.post('/comments/', commentData)
}

// 更新评论
export const updateComment = (commentId, commentData) => {
  return api.put(`/comments/${commentId}`, commentData)
}

// 删除评论
export const deleteComment = (commentId) => {
  return api.delete(`/comments/${commentId}`)
}

// 获取任务的评论 - 修正为与API文档一致的接口
export const getTaskComments = (taskId, params) => {
  return api.get(`/comments/task/${taskId}`, { params })
}