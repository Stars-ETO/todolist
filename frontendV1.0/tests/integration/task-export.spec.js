import { createStore } from 'vuex'
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
          exportStatus: 'idle' // idle, exporting, success, error
        },
        mutations: {
          SET_TASKS(state, tasks) {
            state.tasks = tasks
          },
          SET_EXPORT_STATUS(state, status) {
            state.exportStatus = status
          }
        },
        actions: {
          exportTasksToCSV({ commit }, params) {
            commit('SET_EXPORT_STATUS', 'exporting')
            return taskServices.exportTasksToCSV(params)
              .then(response => {
                commit('SET_EXPORT_STATUS', 'success')
                return response
              })
              .catch(error => {
                commit('SET_EXPORT_STATUS', 'error')
                throw error
              })
          }
        },
        getters: {
          exportStatus: state => state.exportStatus
        }
      }
    }
  })
}

describe('Task Export Integration', () => {
  let store
  
  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
  })
  
  describe('Export Tasks to CSV', () => {
    it('should export tasks to CSV successfully', async () => {
      // Mock API response (blob data)
      const mockBlob = new Blob(['id,title,status\n1,Test Task,completed'], { 
        type: 'text/csv' 
      })
      
      const mockResponse = { data: mockBlob }
      jest.spyOn(taskServices, 'exportTasksToCSV').mockResolvedValue(mockResponse)
      
      // Prepare export parameters
      const params = {
        status: 'completed',
        priority: 'high'
      }
      
      // Dispatch action
      const result = await store.dispatch('tasks/exportTasksToCSV', params)
      
      // Assertions
      expect(taskServices.exportTasksToCSV).toHaveBeenCalledWith(params)
      expect(result).toEqual(mockResponse)
      expect(store.getters['tasks/exportStatus']).toBe('success')
    })
    
    it('should handle export tasks failure', async () => {
      // Mock API error
      const mockError = new Error('Export failed')
      jest.spyOn(taskServices, 'exportTasksToCSV').mockRejectedValue(mockError)
      
      // Prepare export parameters
      const params = {
        status: 'invalid_status'
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('tasks/exportTasksToCSV', params))
        .rejects.toThrow('Export failed')
      
      // Check that the export status was updated to error
      expect(store.getters['tasks/exportStatus']).toBe('error')
    })
    
    it('should export all tasks when no parameters provided', async () => {
      // Mock API response (blob data)
      const mockBlob = new Blob([
        'id,title,status,priority\n1,Task 1,completed,high\n2,Task 2,pending,medium'
      ], { 
        type: 'text/csv' 
      })
      
      const mockResponse = { data: mockBlob }
      jest.spyOn(taskServices, 'exportTasksToCSV').mockResolvedValue(mockResponse)
      
      // Dispatch action without parameters
      const result = await store.dispatch('tasks/exportTasksToCSV', {})
      
      // Assertions
      expect(taskServices.exportTasksToCSV).toHaveBeenCalledWith({})
      expect(result).toEqual(mockResponse)
      expect(store.getters['tasks/exportStatus']).toBe('success')
    })
  })
})