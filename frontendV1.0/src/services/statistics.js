import api from './api'

// 获取任务统计信息
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