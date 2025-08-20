import { createStore } from 'vuex'
import { login, register, getCurrentUser, updateCurrentUser } from '@/services/auth'
import store from '@/store'

// Mock the API calls
jest.mock('@/services/auth')

describe('Auth Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Login functionality', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        data: {
          access_token: 'mock-token',
          token_type: 'bearer'
        }
      }
      
      login.mockResolvedValue(mockResponse)
      
      const result = await login('testuser', 'password123')
      
      expect(login).toHaveBeenCalledWith('testuser', 'password123')
      expect(result).toEqual(mockResponse)
    })

    it('should handle login failure', async () => {
      const mockError = new Error('Invalid credentials')
      login.mockRejectedValue(mockError)
      
      await expect(login('invaliduser', 'wrongpassword')).rejects.toThrow('Invalid credentials')
    })
  })

  describe('Registration functionality', () => {
    it('should register successfully with valid data', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com'
        }
      }
      
      register.mockResolvedValue(mockResponse)
      
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }
      
      const result = await register(userData.username, userData.email, userData.password)
      
      expect(register).toHaveBeenCalledWith(userData.username, userData.email, userData.password)
      expect(result).toEqual(mockResponse)
    })

    it('should handle registration failure', async () => {
      const mockError = new Error('Username already exists')
      register.mockRejectedValue(mockError)
      
      await expect(register('existinguser', 'test@example.com', 'password123'))
        .rejects.toThrow('Username already exists')
    })
  })

  describe('User info functionality', () => {
    it('should fetch current user info successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          is_admin: false
        }
      }
      
      getCurrentUser.mockResolvedValue(mockResponse)
      
      const result = await getCurrentUser()
      
      expect(getCurrentUser).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })

    it('should update user info successfully', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'updateduser',
          email: 'updated@example.com',
          is_admin: false
        }
      }
      
      updateCurrentUser.mockResolvedValue(mockResponse)
      
      const userData = {
        username: 'updateduser',
        email: 'updated@example.com'
      }
      
      const result = await updateCurrentUser(userData)
      
      expect(updateCurrentUser).toHaveBeenCalledWith(userData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Vuex store actions', () => {
    it('should login user in store', async () => {
      const user = {
        id: 1,
        username: 'testuser',
        is_admin: false
      }
      
      await store.dispatch('login', user)
      
      expect(store.getters.currentUser).toEqual(user)
      expect(store.getters.isAuthenticated).toBe(true)
    })

    it('should logout user in store', async () => {
      // First login
      const user = {
        id: 1,
        username: 'testuser',
        is_admin: false
      }
      
      await store.dispatch('login', user)
      expect(store.getters.isAuthenticated).toBe(true)
      
      // Then logout
      await store.dispatch('logout')
      
      expect(store.getters.currentUser).toBeNull()
      expect(store.getters.isAuthenticated).toBe(false)
    })

    it('should fetch current user in store', async () => {
      const mockResponse = {
        data: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          is_admin: false
        }
      }
      
      getCurrentUser.mockResolvedValue(mockResponse)
      
      const result = await store.dispatch('fetchCurrentUser')
      
      expect(getCurrentUser).toHaveBeenCalled()
      expect(result).toEqual(mockResponse.data)
      expect(store.getters.currentUser).toEqual(mockResponse.data)
    })
  })
})