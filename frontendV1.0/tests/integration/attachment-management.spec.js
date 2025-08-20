import { createStore } from 'vuex'
import * as attachmentServices from '@/services/attachments'
import * as taskServices from '@/services/tasks'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

global.localStorage = mockLocalStorage

// 创建测试用的store
const createTestStore = () => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          user: { id: 1, username: 'testuser' },
          token: 'test-token'
        },
        mutations: {
          SET_USER(state, user) {
            state.user = user
          }
        },
        actions: {
          // 用户相关actions
        },
        getters: {
          currentUser: state => state.user,
          isAuthenticated: state => !!state.user
        }
      },
      tasks: {
        namespaced: true,
        state: {
          tasks: [],
          currentTask: null,
          taskAttachments: {}
        },
        mutations: {
          SET_TASKS(state, tasks) {
            state.tasks = tasks
          },
          SET_CURRENT_TASK(state, task) {
            state.currentTask = task
          },
          SET_TASK_ATTACHMENTS(state, { taskId, attachments }) {
            state.taskAttachments = { ...state.taskAttachments, [taskId]: attachments }
          },
          ADD_ATTACHMENT_TO_TASK(state, { taskId, attachment }) {
            if (!state.taskAttachments[taskId]) {
              state.taskAttachments[taskId] = []
            }
            state.taskAttachments[taskId].push(attachment)
          },
          REMOVE_ATTACHMENT_FROM_TASK(state, { taskId, attachmentId }) {
            if (state.taskAttachments[taskId]) {
              state.taskAttachments[taskId] = state.taskAttachments[taskId].filter(
                attachment => attachment.id !== attachmentId
              )
            }
          }
        },
        actions: {
          fetchTaskAttachments({ commit }, taskId) {
            return attachmentServices.getTaskAttachments(taskId).then(response => {
              commit('SET_TASK_ATTACHMENTS', { taskId, attachments: response.data })
              return response.data
            })
          },
          uploadAttachment({ commit }, { taskId, formData }) {
            return attachmentServices.uploadAttachment(taskId, formData).then(response => {
              commit('ADD_ATTACHMENT_TO_TASK', { taskId, attachment: response.data })
              return response.data
            })
          },
          deleteAttachment({ commit }, { taskId, attachmentId }) {
            return attachmentServices.deleteAttachment(taskId, attachmentId).then(() => {
              commit('REMOVE_ATTACHMENT_FROM_TASK', { taskId, attachmentId })
              return attachmentId
            })
          }
        },
        getters: {
          taskAttachments: state => state.taskAttachments
        }
      }
    }
  })
}

describe('Attachment Management Integration', () => {
  let store
  
  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
  })
  
  describe('Upload Attachment', () => {
    it('should upload attachment successfully', async () => {
      // Mock API response
      const mockAttachment = {
        id: 1,
        filename: 'test-file.txt',
        file_size: 1024,
        content_type: 'text/plain'
      }
      
      const mockResponse = { data: mockAttachment }
      jest.spyOn(attachmentServices, 'uploadAttachment').mockResolvedValue(mockResponse)
      
      // Prepare form data
      const formData = new FormData()
      formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test-file.txt')
      
      // Dispatch action
      const result = await store.dispatch('tasks/uploadAttachment', { 
        taskId: 1, 
        formData 
      })
      
      // Assertions
      expect(attachmentServices.uploadAttachment).toHaveBeenCalledWith(1, formData)
      expect(result).toEqual(mockAttachment)
      expect(store.getters['tasks/taskAttachments'][1]).toContainEqual(mockAttachment)
    })
    
    it('should handle upload attachment failure', async () => {
      // Mock API error
      const mockError = new Error('File size exceeds limit')
      jest.spyOn(attachmentServices, 'uploadAttachment').mockRejectedValue(mockError)
      
      // Prepare form data
      const formData = new FormData()
      formData.append('file', new Blob(['large content'], { type: 'text/plain' }), 'large-file.txt')
      
      // Expect the action to reject with the error
      await expect(store.dispatch('tasks/uploadAttachment', { 
        taskId: 1, 
        formData 
      })).rejects.toThrow('File size exceeds limit')
    })
  })
  
  describe('Fetch Task Attachments', () => {
    it('should fetch task attachments successfully', async () => {
      // Mock API response
      const mockAttachments = [
        {
          id: 1,
          filename: 'document.pdf',
          file_size: 102400,
          content_type: 'application/pdf'
        },
        {
          id: 2,
          filename: 'image.png',
          file_size: 204800,
          content_type: 'image/png'
        }
      ]
      
      const mockResponse = { data: mockAttachments }
      jest.spyOn(attachmentServices, 'getTaskAttachments').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('tasks/fetchTaskAttachments', 1)
      
      // Assertions
      expect(attachmentServices.getTaskAttachments).toHaveBeenCalledWith(1)
      expect(result).toEqual(mockAttachments)
      expect(store.getters['tasks/taskAttachments'][1]).toEqual(mockAttachments)
    })
    
    it('should handle fetch task attachments failure', async () => {
      // Mock API error
      const mockError = new Error('Task not found')
      jest.spyOn(attachmentServices, 'getTaskAttachments').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('tasks/fetchTaskAttachments', 999))
        .rejects.toThrow('Task not found')
    })
  })
  
  describe('Delete Attachment', () => {
    it('should delete attachment successfully', async () => {
      // First add attachments to store
      const attachments = [
        {
          id: 1,
          filename: 'document.pdf',
          file_size: 102400,
          content_type: 'application/pdf'
        },
        {
          id: 2,
          filename: 'image.png',
          file_size: 204800,
          content_type: 'image/png'
        }
      ]
      
      store.commit('tasks/SET_TASK_ATTACHMENTS', { taskId: 1, attachments })
      
      // Mock API response
      const mockResponse = { data: {} }
      jest.spyOn(attachmentServices, 'deleteAttachment').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('tasks/deleteAttachment', { 
        taskId: 1, 
        attachmentId: 1 
      })
      
      // Assertions
      expect(attachmentServices.deleteAttachment).toHaveBeenCalledWith(1, 1)
      expect(result).toBe(1)
      expect(store.getters['tasks/taskAttachments'][1]).toHaveLength(1)
      expect(store.getters['tasks/taskAttachments'][1]).not.toContainEqual(attachments[0])
      expect(store.getters['tasks/taskAttachments'][1]).toContainEqual(attachments[1])
    })
    
    it('should handle delete attachment failure', async () => {
      // Mock API error
      const mockError = new Error('Attachment not found')
      jest.spyOn(attachmentServices, 'deleteAttachment').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('tasks/deleteAttachment', { 
        taskId: 1, 
        attachmentId: 999 
      })).rejects.toThrow('Attachment not found')
    })
  })
})