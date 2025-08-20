import { mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import TaskDetail from '@/views/TaskDetail.vue'
import * as taskService from '@/services/tasks'

// Mock the API calls
jest.mock('@/services/tasks')

// Create mock router
const router = new VueRouter()
router.push = jest.fn() // Mock router push

describe('TaskDetail.vue', () => {
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
      currentTask: () => null
    }
    
    // Create mock store
    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('should render task detail page', () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    
    const wrapper = mount(TaskDetail, {
      global: {
        plugins: [store, VueRouter],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      },
      router
    })
    
    expect(wrapper.find('h1').text()).toBe('任务详情')
    expect(wrapper.find('.return-button').exists()).toBe(true)
  })

  it('should load task on creation', () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    
    mount(TaskDetail, {
      global: {
        plugins: [store, VueRouter],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      },
      router
    })
    
    expect(taskService.getTask).toHaveBeenCalledWith('1')
  })

  it('should display task information', async () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Test Task',
        description: 'Test Description',
        status: 'pending',
        priority: 'high',
        created_at: '2023-01-01T00:00:00',
        updated_at: '2023-01-02T00:00:00'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    
    const wrapper = mount(TaskDetail, {
      global: {
        plugins: [store, VueRouter],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      },
      router
    })
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('h2').text()).toBe('Test Task')
    expect(wrapper.find('.info-value').text()).toBe('Test Description')
  })

  it('should mark task as completed', async () => {
    const initialTask = {
      data: {
        id: 1,
        title: 'Test Task',
        status: 'pending'
      }
    }
    
    const updatedTask = {
      data: {
        id: 1,
        title: 'Test Task',
        status: 'completed'
      }
    }
    
    taskService.getTask.mockResolvedValue(initialTask)
    taskService.updateTask.mockResolvedValue(updatedTask)
    
    const wrapper = mount(TaskDetail, {
      global: {
        plugins: [store, VueRouter],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      },
      router
    })
    
    // Wait for initial task load
    await wrapper.vm.$nextTick()
    
    // Click complete button
    const completeButton = wrapper.find('.complete-button')
    await completeButton.trigger('click')
    
    expect(taskService.updateTask).toHaveBeenCalledWith('1', { status: 'completed' })
  })

  it('should delete task', async () => {
    const mockTask = {
      data: {
        id: 1,
        title: 'Task to delete'
      }
    }
    
    taskService.getTask.mockResolvedValue(mockTask)
    taskService.deleteTask.mockResolvedValue()
    
    const wrapper = mount(TaskDetail, {
      global: {
        plugins: [store, VueRouter],
        mocks: {
          $route: {
            params: { id: 1 }
          }
        }
      },
      router
    })
    
    // Wait for task load
    await wrapper.vm.$nextTick()
    
    // Click delete button
    const deleteButton = wrapper.find('.delete-button')
    await deleteButton.trigger('click')
    
    // Simulate confirm dialog
    expect(taskService.deleteTask).toHaveBeenCalledWith('1')
  })
})