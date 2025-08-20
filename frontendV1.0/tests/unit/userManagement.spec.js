import { createStore } from 'vuex'
import store from '@/store'
import { getAllUsers, createUser, updateUser, deleteUser } from '@/services/auth'

// Mock the API calls
jest.mock('@/services/auth')

describe('User Management Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Reset store state
    store.state.users = []
    store.state.usersTotal = 0
  })

  describe('Fetch users functionality', () => {
    it('should fetch all users successfully', async () => {
      const mockResponse = {
        data: {
          users: [
            { id: 1, username: 'admin', email: 'admin@example.com', is_admin: true },
            { id: 2, username: 'user1', email: 'user1@example.com', is_admin: false }
          ],
          total: 2
        }
      }
      
      getAllUsers.mockResolvedValue(mockResponse)
      
      const params = { page: 1, size: 10 }
      const result = await store.dispatch('fetchAllUsers', params)
      
      expect(getAllUsers).toHaveBeenCalledWith(params)
      expect(result).toEqual(mockResponse.data)
      expect(store.getters.allUsers).toEqual(mockResponse.data.users)
      expect(store.getters.usersTotal).toBe(mockResponse.data.total)
    })

    it('should handle fetch users failure', async () => {
      const mockError = new Error('Failed to fetch users')
      getAllUsers.mockRejectedValue(mockError)
      
      await expect(store.dispatch('fetchAllUsers', { page: 1, size: 10 }))
        .rejects.toThrow('Failed to fetch users')
    })
  })

  describe('Create user functionality', () => {
    it('should create user successfully', async () => {
      const newUser = {
        id: 3,
        username: 'user2',
        email: 'user2@example.com',
        is_admin: false,
        created_at: '2023-01-01'
      }
      
      createUser.mockResolvedValue({ data: newUser })
      
      const userData = {
        username: 'user2',
        email: 'user2@example.com',
        is_admin: false
      }
      
      const result = await store.dispatch('createUser', userData)
      
      expect(createUser).toHaveBeenCalledWith(userData)
      expect(result).toEqual(newUser)
      expect(store.getters.allUsers).toContainEqual(newUser)
      expect(store.getters.usersTotal).toBe(1)
    })

    it('should handle create user failure', async () => {
      const mockError = new Error('Failed to create user')
      createUser.mockRejectedValue(mockError)
      
      const userData = {
        username: 'user2',
        email: 'user2@example.com',
        is_admin: false
      }
      
      await expect(store.dispatch('createUser', userData))
        .rejects.toThrow('Failed to create user')
    })
  })

  describe('Update user functionality', () => {
    it('should update user successfully', async () => {
      // First add a user to update
      const initialUser = {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        is_admin: false
      }
      
      store.commit('ADD_USER', initialUser)
      
      const updatedUser = {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        is_admin: true
      }
      
      updateUser.mockResolvedValue({ data: updatedUser })
      
      const result = await store.dispatch('updateUser', {
        userId: 1,
        userData: {
          username: 'updateduser',
          email: 'updated@example.com',
          is_admin: true
        }
      })
      
      expect(updateUser).toHaveBeenCalledWith(1, {
        username: 'updateduser',
        email: 'updated@example.com',
        is_admin: true
      })
      expect(result).toEqual(updatedUser)
      expect(store.getters.allUsers).toContainEqual(updatedUser)
      expect(store.getters.allUsers.find(u => u.id === 1)).toEqual(updatedUser)
    })

    it('should handle update user failure', async () => {
      const mockError = new Error('Failed to update user')
      updateUser.mockRejectedValue(mockError)
      
      await expect(store.dispatch('updateUser', {
        userId: 1,
        userData: { username: 'updateduser' }
      })).rejects.toThrow('Failed to update user')
    })
  })

  describe('Delete user functionality', () => {
    it('should delete user successfully', async () => {
      // First add a user to delete
      const user = {
        id: 1,
        username: 'user1',
        email: 'user1@example.com',
        is_admin: false
      }
      
      store.commit('ADD_USER', user)
      expect(store.getters.allUsers).toHaveLength(1)
      
      deleteUser.mockResolvedValue()
      
      await store.dispatch('deleteUser', 1)
      
      expect(deleteUser).toHaveBeenCalledWith(1)
      expect(store.getters.allUsers).toHaveLength(0)
      expect(store.getters.usersTotal).toBe(0)
    })

    it('should handle delete user failure', async () => {
      const mockError = new Error('Failed to delete user')
      deleteUser.mockRejectedValue(mockError)
      
      await expect(store.dispatch('deleteUser', 1))
        .rejects.toThrow('Failed to delete user')
    })
  })
})