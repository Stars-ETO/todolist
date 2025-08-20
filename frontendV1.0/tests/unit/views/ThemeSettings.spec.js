import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import ThemeSettings from '@/views/ThemeSettings.vue'
import * as authServices from '@/services/auth'

// Mock the auth service functions
jest.mock('@/services/auth')

describe('ThemeSettings.vue', () => {
  let wrapper
  let store
  let actions
  let mocks
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Mock actions
    actions = {
      updateUserSettings: jest.fn()
    }
    
    // Mock router and message
    mocks = {
      $router: {
        go: jest.fn()
      },
      $message: {
        success: jest.fn(),
        error: jest.fn()
      },
      $confirm: jest.fn().mockResolvedValue()
    }
    
    // Create mock store
    store = new Vuex.Store({
      state: {
        settings: {
          theme: 'light',
          themeColor: '#409EFF',
          nightModeBrightness: 'normal',
          notification_enabled: true,
          default_reminder_method: 'popup'
        }
      },
      actions
    })
    
    // Mount component
    wrapper = mount(ThemeSettings, {
      global: {
        plugins: [store],
        mocks
      }
    })
  })
  
  afterEach(() => {
    wrapper.unmount()
  })
  
  it('should render theme settings component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('主题设置')
  })
  
  it('should display current settings', () => {
    expect(wrapper.find('.setting-group').exists()).toBe(true)
  })
  
  
  it('should save settings when save button is clicked', async () => {
    const mockResponse = {
      data: {
        theme: 'dark',
        themeColor: '#ff0000',
        nightModeBrightness: 'dim'
      }
    }
    
    // Mock the updateProfileSettings function from authServices
    authServices.updateProfileSettings = jest.fn().mockResolvedValue(mockResponse)
    
    // Change settings
    wrapper.setData({
      settings: {
        theme: 'dark',
        themeColor: '#ff0000',
        nightModeBrightness: 'dim'
      }
    })
    
    // Call saveSettings method directly
    await wrapper.vm.saveSettings()
    
    expect(authServices.updateProfileSettings).toHaveBeenCalledWith({
      theme: 'dark',
      themeColor: '#ff0000',
      nightModeBrightness: 'dim',
      notification_enabled: true,
      default_reminder_method: 'popup'
    })
    
    // 检查 updateUserSettings 是否被调用
    expect(actions.updateUserSettings).toHaveBeenCalled()
    
    // 获取实际调用的参数
    const callArgs = actions.updateUserSettings.mock.calls[0]
    expect(callArgs[1]).toEqual({
      theme: 'dark',
      themeColor: '#ff0000',
      nightModeBrightness: 'dim'
    })
  })
  
  it('should show success message after saving settings', async () => {
    const mockResponse = { data: {} }
    authServices.updateProfileSettings = jest.fn().mockResolvedValue(mockResponse)
    
    await wrapper.vm.saveSettings()
    
    // Check if success message was called
    expect(mocks.$message.success).toHaveBeenCalledWith('设置保存成功')
  })
  
  it('should show error message when saving fails', async () => {
    const mockError = new Error('Save failed')
    authServices.updateProfileSettings = jest.fn().mockRejectedValue(mockError)
    
    await wrapper.vm.saveSettings()
    
    // Check if error message was called
    expect(mocks.$message.error).toHaveBeenCalledWith('设置保存失败')
  })
  
  it('should go back when back button is clicked', async () => {
    const backButton = wrapper.find('.return-button')
    await backButton.trigger('click')
    
    expect(mocks.$router.go).toHaveBeenCalledWith(-1)
  })
})