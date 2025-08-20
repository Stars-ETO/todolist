import api from './api'

// 上传附件
export const uploadAttachment = (taskId, formData) => {
  return api.post(`/tasks/${taskId}/attachments`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取任务的附件
export const getTaskAttachments = (taskId) => {
  return api.get(`/tasks/${taskId}/attachments`)
}

// 下载附件
export const downloadAttachment = (taskId, attachmentId) => {
  return api.get(`/tasks/${taskId}/attachments/${attachmentId}`, {
    responseType: 'blob'
  })
}

// 删除附件
export const deleteAttachment = (taskId, attachmentId) => {
  return api.delete(`/tasks/${taskId}/attachments/${attachmentId}`)
}