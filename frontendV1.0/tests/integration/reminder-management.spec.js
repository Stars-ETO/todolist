import { createStore } from 'vuex'
import * as reminderServices from '@/services/reminders'
import * as taskServices from '@/services/tasks'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(() => 'test-token'),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

global.localStorage = mockLocalStorage

// 创建store
const createTestStore = () => {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: {
          user: { id: 1, username: 'testuser', is_staff: false },
          token: 'test-token',
          isAdmin: false
        }
      },
      reminders: {
        namespaced: true,
        state: {
          reminders: []
        },
        mutations: {
          SET_REMINDERS(state, reminders) {
            state.reminders = reminders
          }
        },
        actions: {
          fetchReminders({ commit }) {
            return reminderServices.getReminders().then(response => {
              commit('SET_REMINDERS', response.data)
              return response
            })
          },
          createReminder({ dispatch }, reminderData) {
            return reminderServices.createReminder(reminderData).then(response => {
              dispatch('fetchReminders')
              return response
            })
          },
          updateReminder({ dispatch }, { id, data }) {
            return reminderServices.updateReminder(id, data).then(response => {
              dispatch('fetchReminders')
              return response
            })
          },
          deleteReminder({ dispatch }, reminderId) {
            return reminderServices.deleteReminder(reminderId).then(response => {
              dispatch('fetchReminders')
              return response
            })
          }
        }
      },
      tasks: {
        namespaced: true,
        state: {
          tasks: []
        },
        mutations: {
          SET_TASKS(state, tasks) {
            state.tasks = tasks
          }
        },
        actions: {
          fetchTasks({ commit }) {
            return taskServices.getTasks().then(response => {
              commit('SET_TASKS', response.data)
              return response
            })
          }
        }
      }
    }
  })
}

describe('提醒功能集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(reminderServices, 'getReminders').mockResolvedValue({
      data: [
        { id: 1, task: 1, reminder_time: '2023-12-31 10:00:00', repeat: 'none' },
        { id: 2, task: 2, reminder_time: '2023-12-31 15:00:00', repeat: 'daily' }
      ]
    })

    jest.spyOn(reminderServices, 'createReminder').mockResolvedValue({
      data: { id: 3, task: 3, reminder_time: '2023-12-31 12:00:00', repeat: 'none' }
    })

    jest.spyOn(reminderServices, 'updateReminder').mockResolvedValue({
      data: { id: 1, task: 1, reminder_time: '2023-12-31 11:00:00', repeat: 'weekly' }
    })

    jest.spyOn(reminderServices, 'deleteReminder').mockResolvedValue({})

    jest.spyOn(taskServices, 'getTasks').mockResolvedValue({
      data: [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' },
        { id: 3, title: 'Task 3' }
      ]
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以为任务设置提醒', async () => {
    // 创建提醒
    await store.dispatch('reminders/createReminder', {
      task: 3,
      reminder_time: '2023-12-31 12:00:00',
      repeat: 'none'
    })

    // 验证创建提醒API被调用
    expect(reminderServices.createReminder).toHaveBeenCalledWith({
      task: 3,
      reminder_time: '2023-12-31 12:00:00',
      repeat: 'none'
    })

    // 验证提醒列表已更新
    expect(reminderServices.getReminders).toHaveBeenCalled()
  })

  it('用户可以查看任务提醒列表', async () => {
    // 获取提醒列表
    await store.dispatch('reminders/fetchReminders')
    
    // 验证获取提醒API被调用
    expect(reminderServices.getReminders).toHaveBeenCalled()
    
    // 验证提醒列表显示
    expect(store.state.reminders.reminders).toHaveLength(2)
    expect(store.state.reminders.reminders[0].task).toBe(1)
    expect(store.state.reminders.reminders[1].repeat).toBe('daily')
  })

  it('用户可以修改任务提醒', async () => {
    // 更新提醒
    await store.dispatch('reminders/updateReminder', {
      id: 1,
      data: {
        reminder_time: '2023-12-31 11:00:00',
        repeat: 'weekly'
      }
    })

    // 验证更新提醒API被调用
    expect(reminderServices.updateReminder).toHaveBeenCalledWith(1, {
      reminder_time: '2023-12-31 11:00:00',
      repeat: 'weekly'
    })

    // 验证提醒列表已更新
    expect(reminderServices.getReminders).toHaveBeenCalled()
  })

  it('用户可以删除任务提醒', async () => {
    // 删除提醒
    await store.dispatch('reminders/deleteReminder', 1)

    // 验证删除提醒API被调用
    expect(reminderServices.deleteReminder).toHaveBeenCalledWith(1)

    // 验证提醒列表已更新
    expect(reminderServices.getReminders).toHaveBeenCalled()
  })
})