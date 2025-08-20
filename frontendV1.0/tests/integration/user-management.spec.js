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
          user: { id: 1, username: 'admin', is_staff: true },
          token: 'test-token',
          isAdmin: true,
          users: [],
          usersTotal: 0
        },
        mutations: {
          SET_USER(state, user) {
            state.user = user
          },
          SET_TOKEN(state, token) {
            state.token = token
          },
          SET_IS_ADMIN(state, isAdmin) {
            state.isAdmin = isAdmin
          },
          SET_USERS(state, { users, total }) {
            state.users = users
            state.usersTotal = total
          },
          ADD_USER(state, user) {
            state.users.push(user)
            state.usersTotal++
          },
          UPDATE_USER(state, updatedUser) {
            const index = state.users.findIndex(user => user.id === updatedUser.id)
            if (index !== -1) {
              state.users.splice(index, 1, updatedUser)
            }
          },
          REMOVE_USER(state, userId) {
            state.users = state.users.filter(user => user.id !== userId)
            state.usersTotal--
          }
        },
        actions: {
          fetchAllUsers({ commit }, params) {
            return authServices.getAllUsers(params).then(response => {
              commit('SET_USERS', response.data)
              return response.data
            })
          },
          createUser({ commit }, userData) {
            return authServices.createUser(userData).then(response => {
              commit('ADD_USER', response.data)
              return response.data
            })
          },
          updateUser({ commit }, { userId, userData }) {
            return authServices.updateUser(userId, userData).then(response => {
              commit('UPDATE_USER', response.data)
              return response.data
            })
          },
          deleteUser({ commit }, userId) {
            return authServices.deleteUser(userId).then(() => {
              commit('REMOVE_USER', userId)
              return userId
            })
          }
        },
        getters: {
          currentUser: state => state.user,
          isAuthenticated: state => !!state.user,
          allUsers: state => state.users,
          usersTotal: state => state.usersTotal
        }
      }
    }
  })
}

describe('User Management Integration', () => {
  let store
  
  beforeEach(() => {
    store = createTestStore()
    jest.clearAllMocks()
  })
  
  describe('Fetch Users', () => {
    it('should fetch users list successfully', async () => {
      // Mock API response
      const mockResponse = {
        data: {
          users: [
            { id: 1, username: 'admin', email: 'admin@example.com', is_admin: true },
            { id: 2, username: 'user1', email: 'user1@example.com', is_admin: false }
          ],
          total: 2
        }
      }
      
      // Spy on the service method
      jest.spyOn(authServices, 'getAllUsers').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('auth/fetchAllUsers', { page: 1, size: 10 })
      
      // Assertions
      expect(authServices.getAllUsers).toHaveBeenCalledWith({ page: 1, size: 10 })
      expect(result).toEqual(mockResponse.data)
      expect(store.getters['auth/allUsers']).toHaveLength(2)
      expect(store.getters['auth/usersTotal']).toBe(2)
    })
    
    it('should handle fetch users failure', async () => {
      // Mock API error
      const mockError = new Error('Network error')
      jest.spyOn(authServices, 'getAllUsers').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/fetchAllUsers', { page: 1, size: 10 }))
        .rejects.toThrow('Network error')
    })
  })
  
  describe('Create User', () => {
    it('should create a new user successfully', async () => {
      // Mock API response
      const newUser = {
        id: 3,
        username: 'newuser',
        email: 'newuser@example.com',
        is_admin: false
      }
      
      const mockResponse = { data: newUser }
      jest.spyOn(authServices, 'createUser').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('auth/createUser', {
        username: 'newuser',
        email: 'newuser@example.com',
        is_admin: false
      })
      
      // Assertions
      expect(authServices.createUser).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
        is_admin: false
      })
      expect(result).toEqual(newUser)
      expect(store.getters['auth/allUsers']).toContainEqual(newUser)
      expect(store.getters['auth/usersTotal']).toBe(1)
    })
    
    it('should handle create user failure', async () => {
      // Mock API error
      const mockError = new Error('Username already exists')
      jest.spyOn(authServices, 'createUser').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/createUser', {
        username: 'existinguser',
        email: 'existing@example.com',
        is_admin: false
      })).rejects.toThrow('Username already exists')
    })
  })
  
  describe('Update User', () => {
    it('should update user successfully', async () => {
      // First add a user
      const initialUser = {
        id: 1,
        username: 'user',
        email: 'user@example.com',
        is_admin: false
      }
      
      store.commit('auth/SET_USERS', { users: [initialUser], total: 1 })
      
      // Mock API response for update
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        is_admin: true
      }
      
      const mockResponse = { data: updatedUser }
      jest.spyOn(authServices, 'updateUser').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('auth/updateUser', {
        userId: 1,
        userData: {
          username: 'updateduser',
          email: 'updated@example.com',
          is_admin: true
        }
      })
      
      // Assertions
      expect(authServices.updateUser).toHaveBeenCalledWith(1, {
        username: 'updateduser',
        email: 'updated@example.com',
        is_admin: true
      })
      expect(result).toEqual(updatedUser)
      expect(store.getters['auth/allUsers']).toContainEqual(updatedUser)
      expect(store.getters['auth/allUsers']).toHaveLength(1)
    })
    
    it('should handle update user failure', async () => {
      // Mock API error
      const mockError = new Error('User not found')
      jest.spyOn(authServices, 'updateUser').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/updateUser', {
        userId: 999,
        userData: { username: 'nonexistent' }
      })).rejects.toThrow('User not found')
    })
  })
  
  describe('Delete User', () => {
    it('should delete user successfully', async () => {
      // First add users
      const users = [
        { id: 1, username: 'admin', email: 'admin@example.com', is_admin: true },
        { id: 2, username: 'user1', email: 'user1@example.com', is_admin: false }
      ]
      
      store.commit('auth/SET_USERS', { users, total: 2 })
      
      // Mock API response for delete
      const mockResponse = { data: {} }
      jest.spyOn(authServices, 'deleteUser').mockResolvedValue(mockResponse)
      
      // Dispatch action
      const result = await store.dispatch('auth/deleteUser', 2)
      
      // Assertions
      expect(authServices.deleteUser).toHaveBeenCalledWith(2)
      expect(result).toBe(2)
      expect(store.getters['auth/allUsers']).toHaveLength(1)
      expect(store.getters['auth/allUsers']).not.toContainEqual(users[1])
      expect(store.getters['auth/usersTotal']).toBe(1)
    })
    
    it('should handle delete user failure', async () => {
      // Mock API error
      const mockError = new Error('Cannot delete self')
      jest.spyOn(authServices, 'deleteUser').mockRejectedValue(mockError)
      
      // Expect the action to reject with the error
      await expect(store.dispatch('auth/deleteUser', 1))
        .rejects.toThrow('Cannot delete self')
    })
  })
})