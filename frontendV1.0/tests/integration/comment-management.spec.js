import { createStore } from 'vuex'
import * as commentServices from '@/services/comments'
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
      comments: {
        namespaced: true,
        state: {
          comments: [],
          loading: false,
          currentComment: null
        },
        mutations: {
          SET_COMMENTS(state, comments) {
            state.comments = comments
          },
          ADD_COMMENT(state, comment) {
            state.comments.unshift(comment)
          },
          UPDATE_COMMENT(state, updatedComment) {
            const index = state.comments.findIndex(comment => comment.id === updatedComment.id)
            if (index !== -1) {
              state.comments.splice(index, 1, updatedComment)
            }
          },
          REMOVE_COMMENT(state, commentId) {
            state.comments = state.comments.filter(comment => comment.id !== commentId)
          },
          SET_LOADING(state, loading) {
            state.loading = loading
          },
          SET_CURRENT_COMMENT(state, comment) {
            state.currentComment = comment
          }
        },
        actions: {
          async fetchComments({ commit }, params = {}) {
            commit('SET_LOADING', true)
            try {
              const response = await commentServices.getComments(params)
              commit('SET_COMMENTS', response.data.items || response.data)
              return response.data
            } catch (error) {
              throw error
            } finally {
              commit('SET_LOADING', false)
            }
          },
          async fetchTaskComments({ commit }, { taskId, params = {} }) {
            commit('SET_LOADING', true)
            try {
              const response = await commentServices.getTaskComments(taskId, params)
              commit('SET_COMMENTS', response.data.items || response.data)
              return response.data
            } catch (error) {
              throw error
            } finally {
              commit('SET_LOADING', false)
            }
          },
          async createComment({ commit }, commentData) {
            try {
              const response = await commentServices.createComment(commentData)
              commit('ADD_COMMENT', response.data)
              return response.data
            } catch (error) {
              throw error
            }
          },
          async updateComment({ commit }, { commentId, commentData }) {
            try {
              const response = await commentServices.updateComment(commentId, commentData)
              commit('UPDATE_COMMENT', response.data)
              return response.data
            } catch (error) {
              throw error
            }
          },
          async deleteComment({ commit }, commentId) {
            try {
              await commentServices.deleteComment(commentId)
              commit('REMOVE_COMMENT', commentId)
              return commentId
            } catch (error) {
              throw error
            }
          }
        },
        getters: {
          comments: state => state.comments,
          loading: state => state.loading,
          currentComment: state => state.currentComment
        }
      },
      tasks: {
        namespaced: true,
        state: {
          tasks: []
        },
        mutations: {
          SET_TASKS(state, tasks) {
            state.tasks = tasks
          }
        },
        actions: {
          async fetchTasks({ commit }) {
            try {
              const response = await taskServices.getTasks()
              commit('SET_TASKS', response.data.items || response.data)
              return response.data
            } catch (error) {
              throw error
            }
          }
        },
        getters: {
          tasks: state => state.tasks
        }
      },
      users: {
        namespaced: true,
        state: {
          users: []
        },
        mutations: {
          SET_USERS(state, users) {
            state.users = users
          }
        },
        actions: {
          async fetchUsers({ commit }) {
            try {
              const response = await userServices.getUsers()
              commit('SET_USERS', response.data.items || response.data)
              return response.data
            } catch (error) {
              throw error
            }
          }
        },
        getters: {
          users: state => state.users
        }
      }
    }
  })
}

describe('Comment Management Integration', () => {
  let store
  
  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
  })
  
  describe('Fetch Comments', () => {
    it('should fetch all comments successfully', async () => {
      // Mock API response
      const mockComments = [
        {
          id: 1,
          content: 'This is a test comment',
          task_id: 1,
          user_id: 1,
          user: {
            id: 1,
            username: 'testuser'
          },
          task: {
            id: 1,
            title: 'Test Task'
          }
        },
        {
          id: 2,
          content: 'This is another test comment',
          task_id: 2,
          user_id: 2,
          user: {
            id: 2,
            username: 'anotheruser'
          },
          task: {
            id: 2,
            title: 'Another Test Task'
          }
        }
      ]
      
      const mockResponse = { data: { items: mockComments, total: 2 } }
      jest.spyOn(commentServices, 'getComments').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('comments/fetchComments')
      
      // Assertions
      expect(commentServices.getComments).toHaveBeenCalledWith({})
      expect(result).toEqual({ items: mockComments, total: 2 })
      expect(store.getters['comments/comments']).toEqual(mockComments)
      expect(store.getters['comments/loading']).toBe(false)
    })
    
    it('should fetch comments with filters', async () => {
      // Mock API response
      const mockComments = [
        {
          id: 1,
          content: 'Filtered comment',
          task_id: 1,
          user_id: 1,
          user: {
            id: 1,
            username: 'testuser'
          },
          task: {
            id: 1,
            title: 'Test Task'
          }
        }
      ]
      
      const mockResponse = { data: { items: mockComments, total: 1 } }
      jest.spyOn(commentServices, 'getComments').mockResolvedValue(mockResponse)
      
      // Filter parameters
      const params = {
        task_id: 1,
        user_id: 1
      }
      
      // Dispatch action
      const result = await store.dispatch('comments/fetchComments', params)
      
      // Assertions
      expect(commentServices.getComments).toHaveBeenCalledWith({ task_id: 1, user_id: 1 })
      expect(result).toEqual({ items: mockComments, total: 1 })
      expect(store.getters['comments/comments']).toEqual(mockComments)
    })
    
    it('should handle fetch comments failure', async () => {
      // Mock API error
      const mockError = new Error('Failed to fetch comments')
      jest.spyOn(commentServices, 'getComments').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('comments/fetchComments'))
        .rejects.toThrow('Failed to fetch comments')
      
      // Check that loading state is reset
      expect(store.getters['comments/loading']).toBe(false)
    })
  })
  
  describe('Fetch Task Comments', () => {
    it('should fetch comments for a specific task successfully', async () => {
      // Mock API response
      const mockComments = [
        {
          id: 1,
          content: 'Task comment 1',
          task_id: 1,
          user_id: 1,
          user: {
            id: 1,
            username: 'testuser'
          }
        },
        {
          id: 2,
          content: 'Task comment 2',
          task_id: 1,
          user_id: 2,
          user: {
            id: 2,
            username: 'anotheruser'
          }
        }
      ]
      
      const mockResponse = { data: mockComments }
      jest.spyOn(commentServices, 'getTaskComments').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('comments/fetchTaskComments', { taskId: 1 })
      
      // Assertions
      expect(commentServices.getTaskComments).toHaveBeenCalledWith(1, {})
      expect(result).toEqual(mockComments)
      expect(store.getters['comments/comments']).toEqual(mockComments)
      expect(store.getters['comments/loading']).toBe(false)
    })
    
    it('should handle fetch task comments failure', async () => {
      // Mock API error
      const mockError = new Error('Task not found')
      jest.spyOn(commentServices, 'getTaskComments').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('comments/fetchTaskComments', { taskId: 999 }))
        .rejects.toThrow('Task not found')
      
      // Check that loading state is reset
      expect(store.getters['comments/loading']).toBe(false)
    })
  })
  
  describe('Create Comment', () => {
    it('should create a comment successfully', async () => {
      // Mock API response
      const mockComment = {
        id: 3,
        content: 'New comment',
        task_id: 1,
        user_id: 1,
        user: {
          id: 1,
          username: 'testuser'
        },
        task: {
          id: 1,
          title: 'Test Task'
        }
      }
      
      const mockResponse = { data: mockComment }
      jest.spyOn(commentServices, 'createComment').mockResolvedValue(mockResponse)
      
      // Comment data
      const commentData = {
        content: 'New comment',
        task_id: 1
      }
      
      // Dispatch action
      const result = await store.dispatch('comments/createComment', commentData)
      
      // Assertions
      expect(commentServices.createComment).toHaveBeenCalledWith(commentData)
      expect(result).toEqual(mockComment)
      expect(store.getters['comments/comments']).toHaveLength(1)
      expect(store.getters['comments/comments'][0]).toEqual(mockComment)
    })
    
    it('should handle create comment failure', async () => {
      // Mock API error
      const mockError = new Error('Content is required')
      jest.spyOn(commentServices, 'createComment').mockRejectedValue(mockError)
      
      // Comment data
      const commentData = {
        content: '',
        task_id: 1
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('comments/createComment', commentData))
        .rejects.toThrow('Content is required')
      
      // Check that no comment was added
      expect(store.getters['comments/comments']).toHaveLength(0)
    })
  })
  
  describe('Update Comment', () => {
    it('should update a comment successfully', async () => {
      // First add a comment to store
      const initialComment = {
        id: 1,
        content: 'Original comment',
        task_id: 1,
        user_id: 1,
        user: {
          id: 1,
          username: 'testuser'
        }
      }
      
      store.commit('comments/SET_COMMENTS', [initialComment])
      
      // Mock API response
      const updatedComment = {
        id: 1,
        content: 'Updated comment',
        task_id: 1,
        user_id: 1,
        user: {
          id: 1,
          username: 'testuser'
        }
      }
      
      const mockResponse = { data: updatedComment }
      jest.spyOn(commentServices, 'updateComment').mockResolvedValue(mockResponse)
      
      // Update data
      const updateData = {
        content: 'Updated comment'
      }
      
      // Dispatch action
      const result = await store.dispatch('comments/updateComment', { 
        commentId: 1, 
        commentData: updateData 
      })
      
      // Assertions
      expect(commentServices.updateComment).toHaveBeenCalledWith(1, updateData)
      expect(result).toEqual(updatedComment)
      expect(store.getters['comments/comments']).toHaveLength(1)
      expect(store.getters['comments/comments'][0]).toEqual(updatedComment)
    })
    
    it('should handle update comment failure', async () => {
      // First add a comment to store
      const initialComment = {
        id: 1,
        content: 'Original comment',
        task_id: 1,
        user_id: 1
      }
      
      store.commit('comments/SET_COMMENTS', [initialComment])
      
      // Mock API error
      const mockError = new Error('Comment not found')
      jest.spyOn(commentServices, 'updateComment').mockRejectedValue(mockError)
      
      // Update data
      const updateData = {
        content: 'Updated comment'
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('comments/updateComment', { 
        commentId: 999, 
        commentData: updateData 
      })).rejects.toThrow('Comment not found')
      
      // Check that the comment was not updated
      expect(store.getters['comments/comments']).toHaveLength(1)
      expect(store.getters['comments/comments'][0]).toEqual(initialComment)
    })
  })
  
  describe('Delete Comment', () => {
    it('should delete a comment successfully', async () => {
      // First add comments to store
      const comments = [
        {
          id: 1,
          content: 'Comment 1',
          task_id: 1,
          user_id: 1
        },
        {
          id: 2,
          content: 'Comment 2',
          task_id: 1,
          user_id: 1
        }
      ]
      
      store.commit('comments/SET_COMMENTS', comments)
      
      // Mock API response
      const mockResponse = { data: {} }
      jest.spyOn(commentServices, 'deleteComment').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('comments/deleteComment', 1)
      
      // Assertions
      expect(commentServices.deleteComment).toHaveBeenCalledWith(1)
      expect(result).toBe(1)
      expect(store.getters['comments/comments']).toHaveLength(1)
      expect(store.getters['comments/comments'][0]).toEqual(comments[1])
    })
    
    it('should handle delete comment failure', async () => {
      // First add a comment to store
      const comment = {
        id: 1,
        content: 'Test comment',
        task_id: 1,
        user_id: 1
      }
      
      store.commit('comments/SET_COMMENTS', [comment])
      
      // Mock API error
      const mockError = new Error('Comment not found')
      jest.spyOn(commentServices, 'deleteComment').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('comments/deleteComment', 999))
        .rejects.toThrow('Comment not found')
      
      // Check that the comment was not deleted
      expect(store.getters['comments/comments']).toHaveLength(1)
      expect(store.getters['comments/comments'][0]).toEqual(comment)
    })
  })
})