import store from '@/store'

describe('Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    store.replaceState({
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
      
      // 提醒相关
      reminders: [],
      
      // 设置相关
      settings: {
        theme: 'light',
        themeColor: '#ffffff',
        nightModeBrightness: 'normal',
        notification_enabled: true,
        default_reminder_method: 'popup'
      },
      
      // 统计数据
      statistics: {}
    })
  })

  describe('User Management', () => {
    it('should login user', () => {
      const user = {
        id: 1,
        username: 'testuser',
        is_admin: false
      }
      
      store.dispatch('login', user)
      
      expect(store.getters.currentUser).toEqual(user)
      expect(store.getters.isAuthenticated).toBe(true)
    })

    it('should logout user', () => {
      // First login
      const user = {
        id: 1,
        username: 'testuser',
        is_admin: false
      }
      
      store.dispatch('login', user)
      expect(store.getters.isAuthenticated).toBe(true)
      
      // Then logout
      store.dispatch('logout')
      
      expect(store.getters.currentUser).toBeNull()
      expect(store.getters.isAuthenticated).toBe(false)
    })
  })

  describe('Task Management', () => {
    it('should set tasks', () => {
      const tasks = [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ]
      
      store.dispatch('setTasks', tasks)
      
      expect(store.getters.allTasks).toEqual(tasks)
    })

    it('should add task', () => {
      const task = { id: 1, title: 'New Task' }
      
      store.dispatch('addTask', task)
      
      expect(store.getters.allTasks).toContainEqual(task)
      expect(store.getters.allTasks).toHaveLength(1)
    })

    it('should update task', () => {
      // First add a task
      const initialTask = { id: 1, title: 'Initial Task', status: 'pending' }
      store.dispatch('addTask', initialTask)
      
      // Then update it
      const updatedTask = { id: 1, title: 'Updated Task', status: 'completed' }
      store.dispatch('updateTask', updatedTask)
      
      expect(store.getters.allTasks).toContainEqual(updatedTask)
      expect(store.getters.allTasks).toHaveLength(1)
    })

    it('should remove task', () => {
      // First add tasks
      const task1 = { id: 1, title: 'Task 1' }
      const task2 = { id: 2, title: 'Task 2' }
      store.dispatch('addTask', task1)
      store.dispatch('addTask', task2)
      
      // Then remove one
      store.dispatch('removeTask', 1)
      
      expect(store.getters.allTasks).not.toContainEqual(task1)
      expect(store.getters.allTasks).toContainEqual(task2)
      expect(store.getters.allTasks).toHaveLength(1)
    })
  })

  describe('Category Management', () => {
    it('should set categories', () => {
      const categories = [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Personal' }
      ]
      
      store.commit('SET_CATEGORIES', categories)
      
      expect(store.state.categories).toEqual(categories)
    })

    it('should add a category', () => {
      const category = { id: 1, name: 'Work' }
      
      store.commit('ADD_CATEGORY', category)
      
      expect(store.state.categories).toContainEqual(category)
    })

    it('should update a category', () => {
      // First add a category
      const category = { id: 1, name: 'Work' }
      store.commit('ADD_CATEGORY', category)
      
      // Then update it
      const updatedCategory = { id: 1, name: 'Work Updated' }
      store.commit('UPDATE_CATEGORY', updatedCategory)
      
      expect(store.state.categories).toContainEqual(updatedCategory)
      expect(store.state.categories).not.toContainEqual(category)
    })

    it('should remove a category', () => {
      // First add categories
      const categories = [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Personal' }
      ]
      store.commit('SET_CATEGORIES', categories)
      
      // Then remove one
      store.commit('REMOVE_CATEGORY', 1)
      
      expect(store.state.categories).toHaveLength(1)
      expect(store.state.categories).not.toContainEqual({ id: 1, name: 'Work' })
    })
  })
  
  describe('Reminder Management', () => {
    it('should set reminders', () => {
      const reminders = [
        { id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' },
        { id: 2, task_id: 2, reminder_time: '2023-01-02T10:00:00Z' }
      ]
      
      store.commit('SET_REMINDERS', reminders)
      
      expect(store.state.reminders).toEqual(reminders)
    })

    it('should add a reminder', () => {
      const reminder = { id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' }
      
      store.commit('ADD_REMINDER', reminder)
      
      expect(store.state.reminders).toContainEqual(reminder)
    })

    it('should update a reminder', () => {
      // First add a reminder
      const reminder = { id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' }
      store.commit('ADD_REMINDER', reminder)
      
      // Then update it
      const updatedReminder = { id: 1, task_id: 1, reminder_time: '2023-01-01T11:00:00Z' }
      store.commit('UPDATE_REMINDER', updatedReminder)
      
      expect(store.state.reminders).toContainEqual(updatedReminder)
      expect(store.state.reminders).not.toContainEqual(reminder)
    })

    it('should remove a reminder', () => {
      // First add reminders
      const reminders = [
        { id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' },
        { id: 2, task_id: 2, reminder_time: '2023-01-02T10:00:00Z' }
      ]
      store.commit('SET_REMINDERS', reminders)
      
      // Then remove one
      store.commit('REMOVE_REMINDER', 1)
      
      expect(store.state.reminders).toHaveLength(1)
      expect(store.state.reminders).not.toContainEqual({ id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' })
    })
  })

  describe('Settings Management', () => {
    it('should set settings', () => {
      const settings = {
        theme: 'dark',
        themeColor: '#000000'
      }
      
      store.dispatch('setSettings', settings)
      
      expect(store.getters.appSettings.theme).toBe('dark')
      expect(store.getters.appSettings.themeColor).toBe('#000000')
    })

    it('should update individual setting', () => {
      store.dispatch('updateSetting', { key: 'theme', value: 'dark' })
      
      expect(store.getters.appSettings.theme).toBe('dark')
      // Other settings should remain unchanged
      expect(store.getters.appSettings.themeColor).toBe('#ffffff')
    })
  })

  describe('Statistics Management', () => {
    it('should set statistics', () => {
      const statistics = {
        total_tasks: 10,
        completed_tasks: 5
      }
      
      store.commit('SET_STATISTICS', statistics)
      
      expect(store.state.statistics).toEqual(statistics)
    })
  })
})