import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import CategoryManagement from '@/views/CategoryManagement.vue'
import * as categoryService from '@/services/categories'

// Mock the API calls
jest.mock('@/services/categories')

// Create mock router
const router = new VueRouter()

describe('CategoryManagement.vue', () => {
  let store
  let actions
  let getters
  let state

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    
    // Define mock actions
    actions = {
      setCategories: jest.fn(),
      addCategory: jest.fn(),
      updateCategory: jest.fn(),
      removeCategory: jest.fn()
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

  it('should render category management page', () => {
    const mockCategories = {
      data: {
        items: []
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    const wrapper = mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(wrapper.find('h1').text()).toBe('分类管理')
    expect(wrapper.find('.return-button').exists()).toBe(true)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  it('should load categories on creation', () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work', description: 'Work tasks' },
          { id: 2, name: 'Personal', description: 'Personal tasks' }
        ]
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(categoryService.getCategories).toHaveBeenCalled()
  })

  it('should display categories in table', async () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work', description: 'Work tasks', task_count: 5 },
          { id: 2, name: 'Personal', description: 'Personal tasks', task_count: 3 }
        ]
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    const wrapper = mount(CategoryManagement, {
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
    expect(firstRowColumns.at(1).text()).toBe('Work')
    expect(firstRowColumns.at(2).text()).toBe('Work tasks')
    expect(firstRowColumns.at(3).text()).toBe('5')
    
    // Check second row
    const secondRowColumns = rows.at(1).findAll('.cell')
    expect(secondRowColumns.at(1).text()).toBe('Personal')
    expect(secondRowColumns.at(2).text()).toBe('Personal tasks')
    expect(secondRowColumns.at(3).text()).toBe('3')
  })

  it('should open create category dialog', async () => {
    const mockCategories = {
      data: {
        items: []
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    const wrapper = mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Click create button
    const createButton = wrapper.find('.el-button--primary')
    await createButton.trigger('click')
    
    // Check if dialog is opened
    expect(wrapper.vm.showCreateDialog).toBe(true)
    expect(wrapper.find('.el-dialog').exists()).toBe(true)
  })

  it('should create a new category', async () => {
    const mockCategories = {
      data: {
        items: []
      }
    }
    
    const mockCreatedCategory = {
      data: {
        id: 1,
        name: 'New Category',
        description: 'New Description'
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    categoryService.createCategory.mockResolvedValue(mockCreatedCategory)
    
    const wrapper = mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Open create dialog
    wrapper.setData({ showCreateDialog: true })
    
    // Fill form data
    wrapper.setData({
      createForm: {
        name: 'New Category',
        description: 'New Description'
      }
    })
    
    // Submit form
    const submitButton = wrapper.find('.el-dialog .el-button--primary')
    await submitButton.trigger('click')
    
    expect(categoryService.createCategory).toHaveBeenCalledWith({
      name: 'New Category',
      description: 'New Description'
    })
  })

  it('should edit a category', async () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work', description: 'Work tasks' }
        ]
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    const wrapper = mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for categories to load
    await wrapper.vm.$nextTick()
    
    // Click edit button
    const editButton = wrapper.find('.el-table__row .el-button')
    await editButton.trigger('click')
    
    // Check if edit dialog is opened with correct data
    expect(wrapper.vm.showEditDialog).toBe(true)
    expect(wrapper.vm.editForm.name).toBe('Work')
    expect(wrapper.vm.editForm.description).toBe('Work tasks')
  })

  it('should update a category', async () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work', description: 'Work tasks' }
        ]
      }
    }
    
    const mockUpdatedCategory = {
      data: {
        id: 1,
        name: 'Updated Work',
        description: 'Updated work tasks'
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    categoryService.updateCategory.mockResolvedValue(mockUpdatedCategory)
    
    const wrapper = mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for categories to load
    await wrapper.vm.$nextTick()
    
    // Open edit dialog
    wrapper.vm.editCategory({ id: 1, name: 'Work', description: 'Work tasks' })
    
    // Update form data
    wrapper.setData({
      editForm: {
        id: 1,
        name: 'Updated Work',
        description: 'Updated work tasks'
      }
    })
    
    // Submit form
    const submitButton = wrapper.find('.el-dialog .el-button--primary')
    await submitButton.trigger('click')
    
    expect(categoryService.updateCategory).toHaveBeenCalledWith(1, {
      id: 1,
      name: 'Updated Work',
      description: 'Updated work tasks'
    })
  })

  it('should delete a category', async () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work', description: 'Work tasks', task_count: 0 }
        ]
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    categoryService.deleteCategory.mockResolvedValue()
    
    const wrapper = mount(CategoryManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    // Wait for categories to load
    await wrapper.vm.$nextTick()
    
    // Click delete button
    const deleteButton = wrapper.find('.el-table__row .el-button--danger')
    await deleteButton.trigger('click')
    
    // Simulate confirm dialog
    expect(categoryService.deleteCategory).toHaveBeenCalledWith(1)
  })

  it('should disable delete button for categories with tasks', async () => {
    const mockCategories = {
      data: {
        items: [
          { id: 1, name: 'Work', description: 'Work tasks', task_count: 5 }
        ]
      }
    }
    
    categoryService.getCategories.mockResolvedValue(mockCategories)
    
    const wrapper = mount(CategoryManagement, {
      store,
      localVue,
      router
    })
    
    // Wait for categories to load
    await wrapper.vm.$nextTick()
    
    // Find delete button and check if it's disabled
    const deleteButton = wrapper.find('.el-table__row .el-button--danger')
    expect(deleteButton.attributes('disabled')).toBe('disabled')
  })
})