import api from './api'

// 获取提醒列表
export const getReminders = (params) => {
  return api.get('/reminders/', { params })
}

// 获取特定提醒
export const getReminder = (reminderId) => {
  return api.get(`/reminders/${reminderId}`)
}

// 获取任务的提醒
export const getTaskReminders = (taskId, params) => {
  return api.get(`/reminders/tasks/${taskId}`, { params })
}

// 创建提醒
export const createReminder = (reminderData) => {
  return api.post('/reminders/', reminderData)
}

// 更新提醒
export const updateReminder = (reminderId, reminderData) => {
  return api.put(`/reminders/${reminderId}`, reminderData)
}

// 删除提醒
export const deleteReminder = (reminderId) => {
  return api.delete(`/reminders/${reminderId}`)
}

// 激活提醒
export const activateReminder = (reminderId) => {
  return api.post(`/reminders/${reminderId}/activate`)
}

// 停用提醒
export const deactivateReminder = (reminderId) => {
  return api.post(`/reminders/${reminderId}/deactivate`)
}