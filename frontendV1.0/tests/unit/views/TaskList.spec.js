import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import TaskList from '@/views/TaskList.vue'
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

describe('TaskList.vue', () => {
  let store
  let actions
  let getters
  let state

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Define mock actions
    actions = {
      setTasks: jest.fn(),
      setCategories: jest.fn()
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

  it('should render task list page', () => {
    const wrapper = mount(TaskList, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(wrapper.find('h1').text()).toBe('任务管理')
    expect(wrapper.find('.create-task-button').exists()).toBe(true)
    expect(wrapper.find('.trash-button').exists()).toBe(true)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  it('should load tasks on creation', () => {
    const mockResponse = {
      data: {
        items: [
          { id: 1, title: 'Task 1', status: 'pending' },
          { id: 2, title: 'Task 2', status: 'completed' }
        ],
        total: 2
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockResponse)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    taskService.getTasks.mockResolvedValueOnce({ data: { items: [], total: 0 } }) // For deleted tasks count
    
    mount(TaskList, {
      store,
      localVue,
      router
    })
    
    expect(taskService.getTasks).toHaveBeenCalledWith({
      skip: 0,
      limit: 10
    })
  })

  it('should display tasks in table', async () => {
    const mockTasks = {
      data: {
        items: [
          { 
            id: 1, 
            title: 'Task 1', 
            description: 'Description 1', 
            priority: 'high',
            status: 'pending',
            due_date: '2023-12-31T23:59:59'
          },
          { 
            id: 2, 
            title: 'Task 2', 
            description: 'Description 2', 
            priority: 'medium',
            status: 'completed',
            due_date: '2023-12-30T23:59:59'
          }
        ],
        total: 2
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockTasks)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    taskService.getTasks.mockResolvedValueOnce({ data: { items: [], total: 0 } }) // For deleted tasks count
    
    const wrapper = mount(TaskList, {
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
    expect(firstRowColumns.at(1).text()).toBe('Task 1')
    expect(firstRowColumns.at(2).text()).toBe('Description 1')
    
    // Check second row
    const secondRowColumns = rows.at(1).findAll('.cell')
    expect(secondRowColumns.at(1).text()).toBe('Task 2')
    expect(secondRowColumns.at(2).text()).toBe('Description 2')
  })

  it('should handle task deletion', async () => {
    const mockTasks = {
      data: {
        items: [
          { 
            id: 1, 
            title: 'Task to delete', 
            status: 'pending'
          }
        ],
        total: 1
      }
    }
    
    taskService.getTasks.mockResolvedValue(mockTasks)
    categoryService.getCategories.mockResolvedValue({ data: [] })
    taskService.getTasks.mockResolvedValueOnce({ data: { items: [], total: 0 } }) // For deleted tasks count
    taskService.deleteTask.mockResolvedValue()
    
    const wrapper = mount(TaskList, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for async operations
    await wrapper.vm.$nextTick()
    
    // Find delete button and click it
    const deleteButton = wrapper.find('.el-table__row .el-button--danger')
    await deleteButton.trigger('click')
    
    // Confirm deletion (simulate confirm dialog)
    expect(taskService.deleteTask).toHaveBeenCalledWith(1)
  })

  it('should apply filters', async () => {
    taskService.getTasks.mockResolvedValue({ data: { items: [], total: 0 } })
    categoryService.getCategories.mockResolvedValue({ data: [] })
    taskService.getTasks.mockResolvedValueOnce({ data: { items: [], total: 0 } }) // For deleted tasks count
    
    const wrapper = mount(TaskList, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Set filter values
    wrapper.setData({
      filters: {
        status: 'completed',
        priority: 'high',
        search: 'test'
      }
    })
    
    // Click apply filters button
    const applyButton = wrapper.find('.apply-filters-button')
    await applyButton.trigger('click')
    
    expect(taskService.getTasks).toHaveBeenCalledWith({
      skip: 0,
      limit: 10,
      status: 'completed',
      priority: 'high',
      search: 'test'
    })
  })

  it('should handle pagination', async () => {
    taskService.getTasks.mockResolvedValue({ data: { items: [], total: 0 } })
    categoryService.getCategories.mockResolvedValue({ data: [] })
    taskService.getTasks.mockResolvedValueOnce({ data: { items: [], total: 0 } }) // For deleted tasks count
    
    const wrapper = mount(TaskList, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Simulate page size change
    wrapper.vm.handleSizeChange(20)
    
    expect(taskService.getTasks).toHaveBeenCalledWith({
      skip: 0,
      limit: 20
    })
    
    // Simulate page change
    wrapper.vm.handleCurrentChange(2)
    
    expect(taskService.getTasks).toHaveBeenCalledWith({
      skip: 20,
      limit: 20
    })
  })
})