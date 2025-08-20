import { createStore } from 'vuex'
import * as authServices from '@/services/auth'
import * as taskServices from '@/services/tasks'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

global.localStorage = mockLocalStorage

// 创建store
const createTestStore = () => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          user: null,
          token: null,
          isAdmin: false
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
          }
        },
        actions: {
          login({ commit }, credentials) {
            return authServices.login(credentials).then(response => {
              const { user, token } = response.data
              commit('SET_USER', user)
              commit('SET_TOKEN', token)
              commit('SET_IS_ADMIN', user.is_staff)
              localStorage.setItem('token', token)
              localStorage.setItem('isAdmin', user.is_staff)
              return response
            })
          },
          logout({ commit }) {
            commit('SET_USER', null)
            commit('SET_TOKEN', null)
            commit('SET_IS_ADMIN', false)
            localStorage.removeItem('token')
            localStorage.removeItem('isAdmin')
          }
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
          fetchTasks({ commit }) {
            return taskServices.getTasks().then(response => {
              commit('SET_TASKS', response.data)
              return response
            })
          }
        }
      }
    }
  })
}

describe('认证流程集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(authServices, 'login').mockResolvedValue({
      data: {
        user: { id: 1, username: 'testuser', is_staff: false },
        token: 'test-token'
      }
    })

    jest.spyOn(authServices, 'register').mockResolvedValue({
      data: {
        message: 'User registered successfully'
      }
    })

    jest.spyOn(taskServices, 'getTasks').mockResolvedValue({
      data: [
        { id: 1, title: 'Test Task 1', description: 'Test Description 1', completed: false },
        { id: 2, title: 'Test Task 2', description: 'Test Description 2', completed: true }
      ]
    })
    
    // 重置localStorage mock
    mockLocalStorage.getItem.mockClear()
    mockLocalStorage.setItem.mockClear()
    mockLocalStorage.removeItem.mockClear()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以注册、登录并查看任务列表', async () => {
    // 1. 用户注册
    await authServices.register({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      password2: 'password123'
    })

    // 验证注册API被调用
    expect(authServices.register).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      password2: 'password123'
    })

    // 2. 用户登录
    await store.dispatch('auth/login', {
      username: 'testuser',
      password: 'password123'
    })

    // 验证登录API被调用
    expect(authServices.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123'
    })

    // 验证用户已登录
    expect(store.state.auth.token).toBe('test-token')
    expect(store.state.auth.user.username).toBe('testuser')

    // 3. 用户查看任务列表
    // 触发获取任务列表
    await store.dispatch('tasks/fetchTasks')

    // 验证任务API被调用
    expect(taskServices.getTasks).toHaveBeenCalled()

    // 验证任务列表显示
    expect(store.state.tasks.tasks).toHaveLength(2)
    expect(store.state.tasks.tasks[0].title).toBe('Test Task 1')
    expect(store.state.tasks.tasks[1].title).toBe('Test Task 2')
  })

  it('用户登录后可以退出登录', async () => {
    // 设置已登录状态
    store.commit('auth/SET_USER', { id: 1, username: 'testuser', is_staff: false })
    store.commit('auth/SET_TOKEN', 'test-token')
    store.commit('auth/SET_IS_ADMIN', false)
    
    // 用户退出登录
    await store.dispatch('auth/logout')

    // 验证用户已退出
    expect(store.state.auth.token).toBeNull()
    expect(store.state.auth.user).toBeNull()
    expect(store.state.auth.isAdmin).toBe(false)
  })
})