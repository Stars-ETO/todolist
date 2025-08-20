import { createStore } from 'vuex'
import { getCurrentUser } from '@/services/auth'
import { 
  getCategories, 
  createCategory as createCategoryAPI, 
  updateCategory as updateCategoryAPI, 
  deleteCategory as deleteCategoryAPI 
} from '@/services/categories'
import { 
  getReminders as getRemindersAPI,
  createReminder as createReminderAPI,
  updateReminder as updateReminderAPI,
  deleteReminder as deleteReminderAPI,
  activateReminder as activateReminderAPI,
  deactivateReminder as deactivateReminderAPI
} from '@/services/reminders'
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '@/services/auth'

export default createStore({
  state: {
    // 用户信息
    user: null,
    isAuthenticated: false,
    
    // 用户管理（仅管理员使用）
    users: [],
    usersTotal: 0,
    
    // 任务相关
    tasks: [],
    categories: [],
    currentTask: null,
    
    // 设置相关
    settings: {
      theme: 'light', // light, dark, auto
      themeColor: '#ffffff',
      nightModeBrightness: 'normal', // normal, dim, dark
      notification_enabled: true,
      default_reminder_method: 'popup' // popup, sound, mark
    },
    
    // 统计数据
    statistics: {},
    // 提醒信息
    reminders: []
  },
  
  mutations: {
    // 用户相关
    SET_USER(state, user) {
      state.user = user
      state.isAuthenticated = !!user
    },
    
    LOGOUT(state) {
      state.user = null
      state.isAuthenticated = false
      state.users = []
      state.usersTotal = 0
      state.tasks = []
      state.categories = []
      state.currentTask = null
      localStorage.removeItem('token')
      localStorage.removeItem('isAdmin')
    },
    
    // 用户管理相关
    SET_USERS(state, { users, total }) {
      state.users = users
      state.usersTotal = total
    },
    
    ADD_USER(state, user) {
      state.users.push(user)
      state.usersTotal++
    },
    
    UPDATE_USER(state, updatedUser) {
      const index = state.users.findIndex(user => user.id === updatedUser.id)
      if (index !== -1) {
        state.users.splice(index, 1, updatedUser)
      }
    },
    
    REMOVE_USER(state, userId) {
      state.users = state.users.filter(user => user.id !== userId)
      state.usersTotal--
    },
    
    // 任务相关
    SET_TASKS(state, tasks) {
      state.tasks = tasks
    },
    
    ADD_TASK(state, task) {
      state.tasks.push(task)
    },
    
    UPDATE_TASK(state, updatedTask) {
      const index = state.tasks.findIndex(task => task.id === updatedTask.id)
      if (index !== -1) {
        state.tasks.splice(index, 1, updatedTask)
      }
      
      // 如果更新的是当前任务，也更新当前任务
      if (state.currentTask && state.currentTask.id === updatedTask.id) {
        state.currentTask = updatedTask
      }
    },
    
    REMOVE_TASK(state, taskId) {
      state.tasks = state.tasks.filter(task => task.id !== taskId)
      
      // 如果删除的是当前任务，清空当前任务
      if (state.currentTask && state.currentTask.id === taskId) {
        state.currentTask = null
      }
    },
    
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },
    
    ADD_CATEGORY(state, category) {
      state.categories.push(category)
    },
    
    UPDATE_CATEGORY(state, updatedCategory) {
      const index = state.categories.findIndex(category => category.id === updatedCategory.id)
      if (index !== -1) {
        state.categories.splice(index, 1, updatedCategory)
      }
    },
    
    REMOVE_CATEGORY(state, categoryId) {
      state.categories = state.categories.filter(category => category.id !== categoryId)
    },
    
    SET_CURRENT_TASK(state, task) {
      state.currentTask = task
    },
    
    // 设置相关
    SET_SETTINGS(state, settings) {
      state.settings = { ...state.settings, ...settings }
    },
    
    UPDATE_SETTING(state, { key, value }) {
      state.settings[key] = value
    },
    
    // 统计相关
    SET_STATISTICS(state, statistics) {
      state.statistics = statistics
    },
    
    // 提醒相关
    SET_REMINDERS(state, reminders) {
      state.reminders = reminders
    },
    
    ADD_REMINDER(state, reminder) {
      state.reminders.push(reminder)
    },
    
    UPDATE_REMINDER(state, updatedReminder) {
      const index = state.reminders.findIndex(reminder => reminder.id === updatedReminder.id)
      if (index !== -1) {
        state.reminders.splice(index, 1, updatedReminder)
      }
    },
    
    REMOVE_REMINDER(state, reminderId) {
      state.reminders = state.reminders.filter(reminder => reminder.id !== reminderId)
    }
  },
  
  actions: {
    // 用户相关
    async login({ commit }, user) {
      commit('SET_USER', user)
    },
    
    async fetchCurrentUser({ commit }) {
      try {
        const response = await getCurrentUser()
        const user = response.data
        commit('SET_USER', user)
        
        // 更新 localStorage 中的管理员状态
        localStorage.setItem('isAdmin', user.role === 'admin')
        
        return user
      } catch (error) {
        console.error('Failed to fetch current user:', error)
        // 清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('isAdmin')
        commit('LOGOUT')
        throw error
      }
    },
    
    logout({ commit }) {
      commit('LOGOUT')
    },
    
    // 用户管理相关（仅管理员）
    async fetchAllUsers({ commit }, params) {
      try {
        const response = await getAllUsers(params)
        commit('SET_USERS', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch users:', error)
        throw error
      }
    },
    
    async createUser({ commit }, userData) {
      try {
        const response = await createUser(userData)
        commit('ADD_USER', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create user:', error)
        throw error
      }
    },
    
    async updateUser({ commit }, { userId, userData }) {
      try {
        const response = await updateUser(userId, userData)
        commit('UPDATE_USER', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to update user:', error)
        throw error
      }
    },
    
    async deleteUser({ commit }, userId) {
      try {
        await deleteUser(userId)
        commit('REMOVE_USER', userId)
        return true
      } catch (error) {
        console.error('Failed to delete user:', error)
        throw error
      }
    },
    
    // 任务相关
    setTasks({ commit }, tasks) {
      commit('SET_TASKS', tasks)
    },
    
    addTask({ commit }, task) {
      commit('ADD_TASK', task)
    },
    
    updateTask({ commit }, task) {
      commit('UPDATE_TASK', task)
    },
    
    removeTask({ commit }, taskId) {
      commit('REMOVE_TASK', taskId)
    },
    
    setCategories({ commit }, categories) {
      commit('SET_CATEGORIES', categories)
    },
    
    async addCategory({ commit }, category) {
      try {
        const response = await createCategoryAPI(category)
        commit('ADD_CATEGORY', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create category:', error)
        throw error
      }
    },
    
    async updateCategory({ commit }, category) {
      try {
        const response = await updateCategoryAPI(category.id, category)
        commit('UPDATE_CATEGORY', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to update category:', error)
        throw error
      }
    },
    
    async removeCategory({ commit }, categoryId) {
      try {
        await deleteCategoryAPI(categoryId)
        commit('REMOVE_CATEGORY', categoryId)
        return true
      } catch (error) {
        console.error('Failed to delete category:', error)
        throw error
      }
    },
    
    setCurrentTask({ commit }, task) {
      commit('SET_CURRENT_TASK', task)
    },
    
    // 设置相关
    setSettings({ commit }, settings) {
      commit('SET_SETTINGS', settings)
    },
    
    updateSetting({ commit }, payload) {
      commit('UPDATE_SETTING', payload)
    },
    
    // 统计相关
    setStatistics({ commit }, statistics) {
      commit('SET_STATISTICS', statistics)
    },
    
    // 提醒相关
    async fetchReminders({ commit }, params) {
      try {
        const response = await getRemindersAPI(params)
        commit('SET_REMINDERS', response.data.items || response.data)
        return response.data
      } catch (error) {
        console.error('Failed to fetch reminders:', error)
        throw error
      }
    },
    
    async createReminder({ commit }, reminderData) {
      try {
        const response = await createReminderAPI(reminderData)
        commit('ADD_REMINDER', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to create reminder:', error)
        throw error
      }
    },
    
    async updateReminder({ commit }, { reminderId, reminderData }) {
      try {
        const response = await updateReminderAPI(reminderId, reminderData)
        commit('UPDATE_REMINDER', response.data)
        return response.data
      } catch (error) {
        console.error('Failed to update reminder:', error)
        throw error
      }
    },
    
    async deleteReminder({ commit }, reminderId) {
      try {
        await deleteReminderAPI(reminderId)
        commit('REMOVE_REMINDER', reminderId)
        return true
      } catch (error) {
        console.error('Failed to delete reminder:', error)
        throw error
      }
    },
    
    async activateReminder({ commit }, reminderId) {
      try {
        await activateReminderAPI(reminderId)
        // 更新本地状态
        commit('UPDATE_REMINDER', { id: reminderId, is_active: true })
        return true
      } catch (error) {
        console.error('Failed to activate reminder:', error)
        throw error
      }
    },
    
    async deactivateReminder({ commit }, reminderId) {
      try {
        await deactivateReminderAPI(reminderId)
        // 更新本地状态
        commit('UPDATE_REMINDER', { id: reminderId, is_active: false })
        return true
      } catch (error) {
        console.error('Failed to deactivate reminder:', error)
        throw error
      }
    }
  },
  
  getters: {
    // 用户相关
    isAuthenticated: state => state.isAuthenticated,
    currentUser: state => state.user,
    isAdmin: state => state.user && state.user.is_admin,
    
    // 用户管理相关
    allUsers: state => state.users,
    usersTotal: state => state.usersTotal,
    
    // 任务相关
    allTasks: state => state.tasks,
    taskCategories: state => state.categories,
    currentTask: state => state.currentTask,
    
    // 设置相关
    appSettings: state => state.settings,
    
    // 统计相关
    taskStatistics: state => state.statistics,
    
    // 提醒相关
    allReminders: state => state.reminders
  },
  
  modules: {
    // 可以在这里添加模块
  }
})