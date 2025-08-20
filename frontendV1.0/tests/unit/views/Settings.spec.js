import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Settings from '@/views/Settings.vue'
import { updateCurrentUser, updateProfileSettings, changePassword } from '@/services/auth'

// Mock the API calls
jest.mock('@/services/auth')

// Create local Vue instance
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)

// Create mock router
const router = new VueRouter()

describe('Settings.vue', () => {
  let store
  let actions
  let getters
  let state

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Define mock actions
    actions = {
      fetchCurrentUser: jest.fn(),
      updateSetting: jest.fn()
    }
    
    // Define mock getters
    getters = {
      currentUser: () => ({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        nickname: 'Test User',
        bio: 'This is a test user'
      }),
      appSettings: () => ({
        theme: 'light',
        themeColor: '#ffffff',
        nightModeBrightness: 'normal',
        notification_enabled: true,
        default_reminder_method: 'popup'
      })
    }
    
    // Create mock store
    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('should render settings tabs', () => {
    const wrapper = mount(Settings, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(wrapper.find('h1').text()).toBe('个人设置')
    expect(wrapper.find('.return-button').exists()).toBe(true)
    expect(wrapper.find('.settings-tabs').exists()).toBe(true)
    
    // Check if all tabs are present
    const tabLabels = wrapper.findAll('.el-tabs__item')
    expect(tabLabels).toHaveLength(4)
    
    expect(tabLabels.at(0).text()).toBe('个人信息')
    expect(tabLabels.at(1).text()).toBe('界面设置')
    expect(tabLabels.at(2).text()).toBe('提醒设置')
    expect(tabLabels.at(3).text()).toBe('安全设置')
  })

  it('should initialize forms with user data', () => {
    const wrapper = mount(Settings, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Check profile form initialization
    expect(wrapper.vm.profileForm.username).toBe('testuser')
    expect(wrapper.vm.profileForm.email).toBe('test@example.com')
    expect(wrapper.vm.profileForm.nickname).toBe('Test User')
    expect(wrapper.vm.profileForm.bio).toBe('This is a test user')
    
    // Check settings form initialization
    expect(wrapper.vm.settingsForm.theme).toBe('light')
    expect(wrapper.vm.settingsForm.themeColor).toBe('#ffffff')
    expect(wrapper.vm.settingsForm.nightModeBrightness).toBe('normal')
    
    // Check notification form initialization
    expect(wrapper.vm.notificationForm.notification_enabled).toBe(true)
    expect(wrapper.vm.notificationForm.default_reminder_method).toBe('popup')
  })

  it('should update profile when form is submitted', async () => {
    const mockResponse = {
      data: {
        id: 1,
        username: 'updateduser',
        email: 'updated@example.com',
        nickname: 'Updated User',
        bio: 'This is an updated user'
      }
    }
    
    updateCurrentUser.mockResolvedValue(mockResponse)
    actions.fetchCurrentUser.mockResolvedValue()
    
    const wrapper = mount(Settings, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Update form data
    wrapper.setData({
      profileForm: {
        username: 'updateduser',
        email: 'updated@example.com',
        nickname: 'Updated User',
        bio: 'This is an updated user'
      }
    })
    
    // Submit profile form
    await wrapper.findAll('form').at(0).trigger('submit.prevent')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if updateCurrentUser was called with correct parameters
    expect(updateCurrentUser).toHaveBeenCalledWith({
      username: 'updateduser',
      email: 'updated@example.com',
      nickname: 'Updated User',
      bio: 'This is an updated user'
    })
    
    // Check if fetchCurrentUser was called
    expect(actions.fetchCurrentUser).toHaveBeenCalled()
  })

  it('should update interface settings when form is submitted', async () => {
    const mockResponse = {
      data: {
        theme: 'dark',
        themeColor: '#000000',
        nightModeBrightness: 'dim'
      }
    }
    
    updateProfileSettings.mockResolvedValue(mockResponse)
    
    const wrapper = mount(Settings, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Update form data
    wrapper.setData({
      settingsForm: {
        theme: 'dark',
        themeColor: '#000000',
        nightModeBrightness: 'dim'
      }
    })
    
    // Submit settings form
    await wrapper.findAll('form').at(1).trigger('submit.prevent')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if updateProfileSettings was called with correct parameters
    expect(updateProfileSettings).toHaveBeenCalledWith({
      theme: 'dark',
      themeColor: '#000000',
      nightModeBrightness: 'dim'
    })
    
    // Check if updateSetting action was called
    expect(actions.updateSetting).toHaveBeenCalledWith({
      theme: 'dark',
      themeColor: '#000000',
      nightModeBrightness: 'dim'
    })
  })

  it('should change password when form is submitted', async () => {
    const mockResponse = {}
    changePassword.mockResolvedValue(mockResponse)
    
    const wrapper = mount(Settings, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Update form data
    wrapper.setData({
      passwordForm: {
        current_password: 'current123',
        new_password: 'new123456',
        confirm_new_password: 'new123456'
      }
    })
    
    // Submit password form
    await wrapper.findAll('form').at(3).trigger('submit.prevent')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if changePassword was called with correct parameters
    expect(changePassword).toHaveBeenCalledWith({
      current_password: 'current123',
      new_password: 'new123456'
    })
  })

  it('should show error message when new passwords do not match', async () => {
    const wrapper = mount(Settings, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Update form data with mismatched passwords
    wrapper.setData({
      passwordForm: {
        current_password: 'current123',
        new_password: 'new123456',
        confirm_new_password: 'different123'
      }
    })
    
    // Submit password form
    await wrapper.findAll('form').at(3).trigger('submit.prevent')
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if error message is displayed
    expect(wrapper.find('.message.error').exists()).toBe(true)
    expect(wrapper.find('.message.error').text()).toBe('新密码和确认密码不一致')
  })

  it('should navigate to theme settings when advanced settings button is clicked', async () => {
    const wrapper = mount(Settings, {
      store,
      localVue,
      router
    })
    
    // Mock router push method
    const mockPush = jest.fn()
    wrapper.vm.$router.push = mockPush
    
    // Find the advanced settings button
    const advancedSettingsButton = wrapper.find('.advanced-settings-button')
    
    // Click the button
    await advancedSettingsButton.trigger('click')
    
    // Check if router push was called with correct path
    expect(mockPush).toHaveBeenCalledWith('/settings/theme')
  })
})