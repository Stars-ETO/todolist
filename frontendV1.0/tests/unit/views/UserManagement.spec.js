import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import VueRouter from 'vue-router'
import UserManagement from '@/views/UserManagement.vue'

// Create mock router
const router = new VueRouter()

describe('UserManagement.vue', () => {
  let store
  let actions
  let getters
  let state

  beforeEach(() => {
    // Define mock actions
    actions = {
      fetchAllUsers: jest.fn().mockResolvedValue(),
      createUser: jest.fn().mockResolvedValue(),
      updateUser: jest.fn().mockResolvedValue(),
      deleteUser: jest.fn().mockResolvedValue()
    }
    
    // Define mock getters
    getters = {
      allUsers: () => [
        { id: 1, username: 'admin', email: 'admin@example.com', is_admin: true, created_at: '2023-01-01' },
        { id: 2, username: 'user1', email: 'user1@example.com', is_admin: false, created_at: '2023-01-02' }
      ],
      usersTotal: () => 2,
      currentUser: () => ({ id: 1, username: 'admin', is_admin: true })
    }
    
    // Create mock store
    store = new Vuex.Store({
      state,
      actions,
      getters
    })
  })

  it('should render user management page', () => {
    const wrapper = mount(UserManagement, {
      global: {
        plugins: [store, VueRouter]
      },
      router
    })
    
    expect(wrapper.find('h1').text()).toBe('用户管理')
    expect(wrapper.find('.return-button').exists()).toBe(true)
    expect(wrapper.find('.toolbar').exists()).toBe(true)
    expect(wrapper.find('.el-table').exists()).toBe(true)
  })

  it('should load users on creation', () => {
    mount(UserManagement, {
      store,
      localVue,
      router
    })
    
    expect(actions.fetchAllUsers).toHaveBeenCalledWith({
      page: 1,
      size: 10,
      keyword: ''
    })
  })

  it('should show user list in table', () => {
    const wrapper = mount(UserManagement, {
      store,
      localVue,
      router
    })
    
    const rows = wrapper.findAll('.el-table__row')
    expect(rows).toHaveLength(2)
    
    // Check first row (admin user)
    const firstRowColumns = rows.at(0).findAll('.cell')
    expect(firstRowColumns.at(1).text()).toBe('admin')
    expect(firstRowColumns.at(2).text()).toBe('admin@example.com')
    expect(firstRowColumns.at(3).find('.el-tag').text()).toBe('是')
    
    // Check second row (regular user)
    const secondRowColumns = rows.at(1).findAll('.cell')
    expect(secondRowColumns.at(1).text()).toBe('user1')
    expect(secondRowColumns.at(2).text()).toBe('user1@example.com')
    expect(secondRowColumns.at(3).find('.el-tag').text()).toBe('否')
  })

  it('should handle pagination', async () => {
    const wrapper = mount(UserManagement, {
      store,
      localVue,
      router
    })
    
    // Mock updated getters for second page
    store.getters.allUsers = () => [
      { id: 3, username: 'user2', email: 'user2@example.com', is_admin: false, created_at: '2023-01-03' }
    ]
    store.getters.usersTotal = () => 3
    
    // Simulate page size change
    await wrapper.find('.el-pagination .el-pagination__sizes .el-select').trigger('click')
    // This would normally open the dropdown, but we'll directly call the method
    wrapper.vm.handleSizeChange(20)
    
    expect(actions.fetchAllUsers).toHaveBeenCalledWith({
      page: 1,
      size: 20,
      keyword: ''
    })
    
    // Simulate page change
    wrapper.vm.handleCurrentChange(2)
    
    expect(actions.fetchAllUsers).toHaveBeenCalledWith({
      page: 2,
      size: 20,
      keyword: ''
    })
  })

  it('should open create user dialog', async () => {
    const wrapper = mount(UserManagement, {
      store,
      localVue,
      router
    })
    
    // Click create user button
    await wrapper.find('.toolbar .el-button[type="success"]').trigger('click')
    
    // Check if dialog is opened
    expect(wrapper.vm.showCreateUserDialog).toBe(true)
    expect(wrapper.find('.el-dialog').exists()).toBe(true)
  })

  it('should open edit user dialog', async () => {
    const wrapper = mount(UserManagement, {
      store,
      localVue,
      router
    })
    
    // Click edit button for first user
    const editButton = wrapper.find('.el-table__row .el-button')
    await editButton.trigger('click')
    
    // Check if dialog is opened
    expect(wrapper.vm.showEditUserDialog).toBe(true)
    expect(wrapper.find('.el-dialog').exists()).toBe(true)
  })

  it('should disable delete button for last admin user', async () => {
    // Update store to have only one admin user
    store.getters.allUsers = () => [
      { id: 1, username: 'admin', email: 'admin@example.com', is_admin: true, created_at: '2023-01-01' },
      { id: 2, username: 'user1', email: 'user1@example.com', is_admin: false, created_at: '2023-01-02' }
    ]
    
    const wrapper = mount(UserManagement, {
      store,
      localVue,
      router
    })
    
    // Find the delete button for admin user
    const deleteButtons = wrapper.findAll('.el-table__row .el-button[type="danger"]')
    const adminDeleteButton = deleteButtons.at(0)
    
    // Check if delete button for admin user is disabled
    expect(adminDeleteButton.attributes('disabled')).toBe('disabled')
  })
})