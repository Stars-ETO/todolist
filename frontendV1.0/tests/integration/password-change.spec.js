import { createStore } from 'vuex'
import * as authServices from '@/services/auth'

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
          user: { id: 1, username: 'testuser', email: 'test@example.com' },
          token: 'test-token'
        },
        mutations: {
          SET_USER(state, user) {
            state.user = user
          }
        },
        actions: {
          changePassword(_, passwordData) {
            return authServices.changePassword(passwordData)
          },
          updateCurrentUser({ commit }, userData) {
            return authServices.updateCurrentUser(userData).then(response => {
              commit('SET_USER', response.data)
              return response.data
            })
          }
        },
        getters: {
          currentUser: state => state.user
        }
      }
    }
  })
}

describe('Password Change Integration', () => {
  let store
  
  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
  })
  
  describe('Change Password', () => {
    it('should change password successfully', async () => {
      // Mock API response
      const mockResponse = {
        data: { message: 'Password updated successfully' }
      }
      
      // Spy on the service method
      jest.spyOn(authServices, 'changePassword').mockResolvedValue(mockResponse)
      
      // Prepare password data
      const passwordData = {
        current_password: 'oldpassword',
        new_password: 'newpassword'
      }
      
      // Dispatch action
      const result = await store.dispatch('auth/changePassword', passwordData)
      
      // Assertions
      expect(authServices.changePassword).toHaveBeenCalledWith(passwordData)
      expect(result).toEqual(mockResponse) // 修改这里，直接比较整个响应对象
    })
    
    it('should handle change password with wrong current password', async () => {
      // Mock API error
      const mockError = new Error('Current password is incorrect')
      jest.spyOn(authServices, 'changePassword').mockRejectedValue(mockError)
      
      // Prepare password data
      const passwordData = {
        current_password: 'wrongpassword',
        new_password: 'newpassword'
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/changePassword', passwordData))
        .rejects.toThrow('Current password is incorrect')
    })
    
    it('should handle change password with weak new password', async () => {
      // Mock API error
      const mockError = new Error('New password is too weak')
      jest.spyOn(authServices, 'changePassword').mockRejectedValue(mockError)
      
      // Prepare password data
      const passwordData = {
        current_password: 'oldpassword',
        new_password: '123'
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/changePassword', passwordData))
        .rejects.toThrow('New password is too weak')
    })
  })
  
  describe('Update User Profile', () => {
    it('should update user profile successfully', async () => {
      // Mock API response
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com'
      }
      
      const mockResponse = { data: updatedUser }
      jest.spyOn(authServices, 'updateCurrentUser').mockResolvedValue(mockResponse)
      
      // Prepare user data
      const userData = {
        username: 'updateduser',
        email: 'updated@example.com'
      }
      
      // Dispatch action
      const result = await store.dispatch('auth/updateCurrentUser', userData)
      
      // Assertions
      expect(authServices.updateCurrentUser).toHaveBeenCalledWith(userData)
      expect(result).toEqual(updatedUser) // 这里比较data中的内容
      expect(store.getters['auth/currentUser']).toEqual(updatedUser)
    })
    
    it('should handle update user profile with duplicate email', async () => {
      // Mock API error
      const mockError = new Error('Email already exists')
      jest.spyOn(authServices, 'updateCurrentUser').mockRejectedValue(mockError)
      
      // Prepare user data
      const userData = {
        username: 'testuser',
        email: 'duplicate@example.com'
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/updateCurrentUser', userData))
        .rejects.toThrow('Email already exists')
      
      // Ensure the user state is not changed
      expect(store.getters['auth/currentUser'].email).toBe('test@example.com')
    })
    
    it('should handle update user profile with invalid email', async () => {
      // Mock API error
      const mockError = new Error('Invalid email format')
      jest.spyOn(authServices, 'updateCurrentUser').mockRejectedValue(mockError)
      
      // Prepare user data
      const userData = {
        username: 'testuser',
        email: 'invalid-email'
      }
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/updateCurrentUser', userData))
        .rejects.toThrow('Invalid email format')
    })
  })
})