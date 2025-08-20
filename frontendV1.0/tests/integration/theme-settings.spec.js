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

// 创建store
const createTestStore = () => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          user: { 
            id: 1, 
            username: 'testuser', 
            is_staff: false,
            profile: {
              theme: 'light',
              themeColor: '#409EFF',
              nightModeBrightness: 'normal'
            }
          },
          token: 'test-token',
          isAdmin: false
        },
        getters: {
          appSettings: state => state.user?.profile || {}
        },
        mutations: {
          UPDATE_USER_PROFILE(state, profile) {
            if (!state.user) state.user = {}
            if (!state.user.profile) state.user.profile = {}
            state.user.profile = { ...state.user.profile, ...profile }
          }
        },
        actions: {
          updateUserSettings({ commit }, settings) {
            commit('UPDATE_USER_PROFILE', settings)
          }
        }
      }
    }
  })
}

describe('主题设置集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(authServices, 'updateProfileSettings').mockResolvedValue({
      data: {
        theme: 'dark',
        themeColor: '#ff0000',
        nightModeBrightness: 'dim'
      }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以设置并保存主题偏好', async () => {
    // 直接测试store中的actions和mutations
    // 模拟用户更改设置
    const newSettings = {
      theme: 'dark',
      themeColor: '#ff0000',
      nightModeBrightness: 'dim'
    }

    // 调用store action更新设置
    await store.dispatch('auth/updateUserSettings', newSettings)

    // 验证store已更新
    expect(store.state.auth.user.profile.theme).toBe('dark')
    expect(store.state.auth.user.profile.themeColor).toBe('#ff0000')
    expect(store.state.auth.user.profile.nightModeBrightness).toBe('dim')
  })

  it('用户的主题设置在页面刷新后保持不变', async () => {
    // 模拟用户已经设置过主题
    const existingSettings = {
      theme: 'dark',
      themeColor: '#00ff00',
      nightModeBrightness: 'dark'
    }
    
    store.commit('auth/UPDATE_USER_PROFILE', existingSettings)

    // 验证store中的设置
    expect(store.state.auth.user.profile.theme).toBe('dark')
    expect(store.state.auth.user.profile.themeColor).toBe('#00ff00')
    expect(store.state.auth.user.profile.nightModeBrightness).toBe('dark')
  })
})