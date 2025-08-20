import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import TaskEdit from '@/views/TaskEdit.vue'
import * as taskService from '@/services/tasks'
import * as categoryService from '@/services/categories'

// Mock the API calls
jest.mock('@/services/tasks')
jest.mock('@/services/categories')


// Create mock router
const router = new VueRouter()
router.push = jest.fn() // Mock router push

describe('TaskEdit.vue', () => {
  let store
  let actions
  let getters
  let state

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Define mock actions
    actions = {
      setCurrentTask: jest.fn()
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

  it('should render task edit page', () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Test Task'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    const wrapper = mount(TaskEdit, {
      global: {
        plugins: [store, router],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      }
    })
    
    expect(wrapper.find('h1').text()).toBe('编辑任务')
    expect(wrapper.find('.return-button').exists()).toBe(true)
  })

  it('should load task and categories on creation', () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        priority: 'medium',
        status: 'pending'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    mount(TaskEdit, {
      global: {
        plugins: [store, router],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      }
    })
    
    expect(taskService.getTask).toHaveBeenCalledWith('1')
    expect(categoryService.getCategories).toHaveBeenCalled()
  })

  it('should populate form with task data', async () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        priority: 'high',
        status: 'pending'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    const wrapper = mount(TaskEdit, {
      global: {
        plugins: [store, router],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      }
    })
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Check if form is populated with task data
    expect(wrapper.vm.taskForm.title).toBe('Test Task')
    expect(wrapper.vm.taskForm.description).toBe('Test Description')
    expect(wrapper.vm.taskForm.priority).toBe('high')
    expect(wrapper.vm.taskForm.status).toBe('pending')
  })

  it('should update task with valid data', async () => {
    const initialTask = {
      data: {
        id: 1,
        title: 'Original Task',
        description: 'Original Description',
        priority: 'medium',
        status: 'pending'
      }
    }
    
    const updatedTask = {
      data: {
        id: 1,
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'high',
        status: 'in_progress'
      }
    }
    
    taskService.getTask.mockResolvedValue(initialTask)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    taskService.updateTask.mockResolvedValue(updatedTask)
    
    const wrapper = mount(TaskEdit, {
      global: {
        plugins: [store, router],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      }
    })
    
    // Wait for task to load
    await wrapper.vm.$nextTick()
    
    // Update form data
    wrapper.setData({
      taskForm: {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: 'high',
        status: 'in_progress'
      }
    })
    
    // Submit form
    const submitButton = wrapper.find('.el-button--primary')
    await submitButton.trigger('click')
    
    expect(taskService.updateTask).toHaveBeenCalledWith('1', {
      title: 'Updated Task',
      description: 'Updated Description',
      priority: 'high',
      status: 'in_progress'
    })
  })

  it('should reset form to original task data', async () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Original Task',
        description: 'Original Description'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    
    const wrapper = mount(TaskEdit, {
      global: {
        plugins: [store, router],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      }
    })
    
    // Wait for task to load
    await wrapper.vm.$nextTick()
    
    // Modify form data
    wrapper.setData({
      taskForm: {
        title: 'Modified Task',
        description: 'Modified Description'
      }
    })
    
    // Click reset button
    const resetButton = wrapper.find('.el-button:not(.el-button--primary)')
    await resetButton.trigger('click')
    
    // Check if form is reset to original task data
    expect(wrapper.vm.taskForm.title).toBe('Original Task')
    expect(wrapper.vm.taskForm.description).toBe('Original Description')
  })
})