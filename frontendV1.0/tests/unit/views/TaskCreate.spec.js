import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import TaskCreate from '@/views/TaskCreate.vue'
import * as taskService from '@/services/tasks'
import * as categoryService from '@/services/categories'

// Mock the API calls
jest.mock('@/services/tasks')
jest.mock('@/services/categories')

// Create local Vue instance
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)

// Create mock router
const router = new VueRouter()
router.push = jest.fn() // Mock router push

describe('TaskCreate.vue', () => {
  let store
  let actions
  let getters
  let state

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Define mock actions
    actions = {
      setTasks: jest.fn()
    }
    
    // Define mock getters
    getters = {
      taskCategories: () => [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Personal' }
      ]
    }
    
    // Create mock store
    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('should render task create page', () => {
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    const wrapper = mount(TaskCreate, {
      global: {
        plugins: [store, router]
      }
    })
    
    expect(wrapper.find('h1').text()).toBe('创建任务')
    expect(wrapper.find('.return-button').exists()).toBe(true)
    expect(wrapper.find('.task-form').exists()).toBe(true)
  })

  it('should load categories on creation', () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work' },
          { id: 2, name: 'Personal' }
        ]
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    mount(TaskCreate, {
      store,
      localVue,
      router
    })
    
    expect(categoryService.getCategories).toHaveBeenCalled()
  })

  it('should create task with valid data', async () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work' }
        ]
      }
    }
    
    const mockCreatedTask = {
      data: {
        id: 1,
        title: 'New Task',
        description: 'New Description',
        priority: 'medium'
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    taskService.createTask.mockResolvedValue(mockCreatedTask)
    
    const wrapper = mount(TaskCreate, {
      global: {
        plugins: [store, router]
      }
    })
    
    // Wait for categories to load
    await wrapper.vm.$nextTick()
    
    // Fill form data
    wrapper.setData({
      taskForm: {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium'
      }
    })
    
    // Submit form
    const submitButton = wrapper.find('.el-button--primary')
    await submitButton.trigger('click')
    
    expect(taskService.createTask).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'New Description',
      priority: 'medium',
      status: 'pending'
    })
  })

  it('should show validation errors for invalid data', async () => {
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    const wrapper = mount(TaskCreate, {
      global: {
        plugins: [store, router]
      }
    })
    
    // Submit form without filling required fields
    const submitButton = wrapper.find('.el-button--primary')
    await submitButton.trigger('click')
    
    // Check if validation errors are shown
    expect(wrapper.find('.el-form-item__error').exists()).toBe(true)
  })

  it('should reset form when reset button is clicked', async () => {
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    const wrapper = mount(TaskCreate, {
      global: {
        plugins: [store, router]
      }
    })
    
    // Fill form data
    wrapper.setData({
      taskForm: {
        title: 'Test Task',
        description: 'Test Description'
      }
    })
    
    // Click reset button
    const resetButton = wrapper.find('.el-button:not(.el-button--primary)')
    await resetButton.trigger('click')
    
    // Check if form is reset
    expect(wrapper.vm.taskForm.title).toBe('')
    expect(wrapper.vm.taskForm.description).toBe('')
  })
})