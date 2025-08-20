import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Login from '@/views/Login.vue'
import { login } from '@/services/auth'

// Mock the API calls
jest.mock('@/services/auth')

// Create mock router
const router = new VueRouter()

describe('Login.vue', () => {
  let store
  let actions
  let state

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Define mock actions
    actions = {
      login: jest.fn()
    }
    
    // Define initial state
    state = {
      isAuthenticated: false
    }
    
    // Create mock store
    store = new Vuex.Store({
      state,
      actions
    })
  })

  it('should render login form', () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(wrapper.find('h2').text()).toBe('用户登录')
    expect(wrapper.find('#username').exists()).toBe(true)
    expect(wrapper.find('#password').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').text()).toBe('登录')
  })

  it('should update form data when user types', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    const usernameInput = wrapper.find('#username')
    const passwordInput = wrapper.find('#password')
    
    await usernameInput.setValue('testuser')
    await passwordInput.setValue('password123')
    
    expect(wrapper.vm.loginForm.username).toBe('testuser')
    expect(wrapper.vm.loginForm.password).toBe('password123')
  })

  it('should call login action with form data when submitted', async () => {
    const mockResponse = {
      data: {
        access_token: 'mock-token',
        token_type: 'bearer'
      }
    }
    
    login.mockResolvedValue(mockResponse)
    actions.fetchCurrentUser = jest.fn().mockResolvedValue()
    
    const wrapper = mount(Login, {
      global: {
        plugins: [new Vuex.Store({
          state,
          actions
        }), VueRouter]
      },
      router
    })
    
    // Fill form
    wrapper.find('#username').setValue('testuser')
    wrapper.find('#password').setValue('password123')
    
    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if login was called with correct parameters
    expect(login).toHaveBeenCalledWith('testuser', 'password123')
    expect(actions.login).toHaveBeenCalled()
    expect(wrapper.vm.loading).toBe(false)
  })

  it('should show error message on login failure', async () => {
    const mockError = new Error('Invalid credentials')
    login.mockRejectedValue(mockError)
    
    const wrapper = mount(Login, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Fill form
    wrapper.find('#username').setValue('invaliduser')
    wrapper.find('#password').setValue('wrongpassword')
    
    // Submit form
    await wrapper.find('form').trigger('submit.prevent')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if error message is displayed
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.find('.error-message').text()).toBe('登录失败，请检查用户名和密码')
    expect(wrapper.vm.loading).toBe(false)
  })

  it('should disable submit button when loading', async () => {
    const wrapper = mount(Login, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Simulate loading state
    wrapper.setData({ loading: true })
    
    const submitButton = wrapper.find('button[type="submit"]')
    expect(submitButton.attributes('disabled')).toBe('disabled')
    expect(submitButton.text()).toBe('登录中...')
  })
})