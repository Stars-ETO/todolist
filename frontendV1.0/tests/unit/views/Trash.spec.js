import { mount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import Trash from '@/views/Trash.vue'
import * as taskService from '@/services/tasks'

// Mock the API calls
jest.mock('@/services/tasks')

// Create local Vue instance
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueRouter)

// Create mock router
const router = new VueRouter()

describe('Trash.vue', () => {
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
      taskCategories: () => []
    }
    
    // Create mock store
    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('should render trash page', () => {
    const mockDeletedTasks = {
      data: {
        items: []
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockDeletedTasks)
    
    const wrapper = mount(Trash, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(wrapper.find('h1').text()).toBe('回收站')
    expect(wrapper.find('.return-button').exists()).toBe(true)
  })

  it('should load deleted tasks on creation', () => {
    const mockDeletedTasks = {
      data: {
        items: [
          { id: 1, title: 'Deleted Task 1' },
          { id: 2, title: 'Deleted Task 2' }
        ]
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockDeletedTasks)
    
    mount(Trash, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(taskService.getTasks).toHaveBeenCalledWith({ status: 'deleted' })
  })

  it('should display deleted tasks in table', async () => {
    const mockDeletedTasks = {
      data: {
        items: [
          { 
            id: 1, 
            title: 'Deleted Task 1', 
            description: 'Description 1',
            deleted_at: '2023-01-01T00:00:00'
          },
          { 
            id: 2, 
            title: 'Deleted Task 2', 
            description: 'Description 2',
            deleted_at: '2023-01-02T00:00:00'
          }
        ]
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockDeletedTasks)
    
    const wrapper = mount(Trash, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    const rows = wrapper.findAll('.el-table__row')
    expect(rows).toHaveLength(2)
    
    // Check first row
    const firstRowColumns = rows.at(0).findAll('.cell')
    expect(firstRowColumns.at(1).text()).toBe('Deleted Task 1')
    expect(firstRowColumns.at(2).text()).toBe('Description 1')
    
    // Check second row
    const secondRowColumns = rows.at(1).findAll('.cell')
    expect(secondRowColumns.at(1).text()).toBe('Deleted Task 2')
    expect(secondRowColumns.at(2).text()).toBe('Description 2')
  })

  it('should restore a deleted task', async () => {
    const mockDeletedTasks = {
      data: {
        items: [
          { id: 1, title: 'Task to restore' }
        ]
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockDeletedTasks)
    taskService.restoreTask.mockResolvedValue()
    
    const wrapper = mount(Trash, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for tasks to load
    await wrapper.vm.$nextTick()
    
    // Find restore button and click it
    const restoreButton = wrapper.find('.el-table__row .el-button')
    await restoreButton.trigger('click')
    
    expect(taskService.restoreTask).toHaveBeenCalledWith(1)
  })

  it('should permanently delete a task', async () => {
    const mockDeletedTasks = {
      data: {
        items: [
          { id: 1, title: 'Task to delete permanently' }
        ]
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockDeletedTasks)
    taskService.permanentlyDeleteTask.mockResolvedValue()
    
    const wrapper = mount(Trash, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for tasks to load
    await wrapper.vm.$nextTick()
    
    // Find delete button and click it
    const deleteButton = wrapper.find('.el-table__row .el-button--danger')
    await deleteButton.trigger('click')
    
    // Simulate confirm dialog
    expect(taskService.permanentlyDeleteTask).toHaveBeenCalledWith(1)
  })

  it('should handle batch operations', async () => {
    const mockDeletedTasks = {
      data: {
        items: [
          { id: 1, title: 'Task 1' },
          { id: 2, title: 'Task 2' }
        ]
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockDeletedTasks)
    taskService.restoreTask.mockResolvedValue()
    taskService.permanentlyDeleteTask.mockResolvedValue()
    
    const wrapper = mount(Trash, {
      store,
      localVue,
      router
    })
    
    // Wait for tasks to load
    await wrapper.vm.$nextTick()
    
    // Select multiple tasks
    wrapper.vm.handleSelectionChange([
      { id: 1, title: 'Task 1' },
      { id: 2, title: 'Task 2' }
    ])
    
    // Test batch restore
    const restoreButton = wrapper.find('.bulk-restore-button')
    await restoreButton.trigger('click')
    
    // Simulate confirm dialog for restore
    expect(taskService.restoreTask).toHaveBeenCalledWith(1)
    expect(taskService.restoreTask).toHaveBeenCalledWith(2)
    
    // Test batch delete
    const deleteButton = wrapper.find('.bulk-delete-button')
    await deleteButton.trigger('click')
    
    // Simulate confirm dialog for delete
    expect(taskService.permanentlyDeleteTask).toHaveBeenCalledWith(1)
    expect(taskService.permanentlyDeleteTask).toHaveBeenCalledWith(2)
  })
})