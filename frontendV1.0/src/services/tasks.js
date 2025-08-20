import api from './api'

// 获取任务列表
export const getTasks = (params) => {
  return api.get('/tasks/', { params })
}

// 获取特定任务
export const getTask = (taskId) => {
  return api.get(`/tasks/${taskId}`)
}

// 创建任务
export const createTask = (taskData) => {
  return api.post('/tasks/', taskData)
}

// 更新任务
export const updateTask = (taskId, taskData) => {
  return api.put(`/tasks/${taskId}`, taskData)
}

// 删除任务（移至回收站）
export const deleteTask = (taskId) => {
  return api.delete(`/tasks/${taskId}`)
}

// 获取回收站任务
export const getDeletedTasks = (params) => {
  return api.get('/tasks/deleted', { params })
}

// 恢复回收站任务
export const restoreTask = (taskId) => {
  return api.post(`/tasks/deleted/${taskId}/restore`)
}

// 永久删除任务
export const permanentlyDeleteTask = (taskId) => {
  return api.delete(`/tasks/deleted/${taskId}`)
}

// 批量更新任务
export const batchUpdateTasks = (batchData) => {
  return api.put('/tasks/batch', batchData)
}

// 批量删除任务
export const batchDeleteTasks = (taskIds) => {
  return api.delete('/tasks/batch', { data: { task_ids: taskIds } })
}

// 导出任务为CSV格式
export const exportTasksToCSV = (params) => {
  return api.get('/tasks/export/csv', { params, responseType: 'blob' })
}

// 获取任务统计信息 - 修正为与API文档一致的接口
export const getTaskStatistics = () => {
  return api.get('/statistics/summary')
}

// 获取任务完成情况统计
export const getTaskCompletionStatistics = () => {
  return api.get('/statistics/tasks/completion')
}

// 获取每日任务统计
export const getDailyTaskStatistics = (params) => {
  return api.get('/statistics/tasks/daily', { params })
}

// 获取分类任务统计
export const getCategoryTaskStatistics = () => {
  return api.get('/statistics/tasks/category')
}

// 获取优先级任务统计
export const getPriorityTaskStatistics = () => {
  return api.get('/statistics/tasks/priority')
}

// 获取逾期任务统计
export const getOverdueTaskStatistics = () => {
  return api.get('/statistics/tasks/overdue')
}

// 获取任务协作者
export const getTaskCollaborators = (taskId) => {
  // 这是一个前端扩展功能，不是后端API，暂时保留但标记为前端扩展
  console.warn('This is a frontend extension feature, not a backend API')
  return Promise.resolve({ data: { items: [] } })
}

// 邀请协作者
export const inviteCollaborator = (inviteData) => {
  // 这是一个前端扩展功能，不是后端API，暂时保留但标记为前端扩展
  console.warn('This is a frontend extension feature, not a backend API')
  return Promise.resolve({ data: {} })
}

// 移除协作者
export const removeCollaborator = (taskId, userId) => {
  // 这是一个前端扩展功能，不是后端API，暂时保留但标记为前端扩展
  console.warn('This is a frontend extension feature, not a backend API')
  return Promise.resolve({ data: {} })
}