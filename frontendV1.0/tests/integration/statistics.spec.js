import { createStore } from 'vuex'
import * as statisticServices from '@/services/statistics'
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
      statistics: {
        namespaced: true,
        state: {
          summary: null,
          completion: null,
          daily: null,
          category: null
        },
        mutations: {
          SET_SUMMARY(state, data) {
            state.summary = data
          },
          SET_COMPLETION(state, data) {
            state.completion = data
          },
          SET_DAILY(state, data) {
            state.daily = data
          },
          SET_CATEGORY(state, data) {
            state.category = data
          }
        },
        actions: {
          fetchSummary({ commit }) {
            return statisticServices.getTaskStatistics().then(response => {
              commit('SET_SUMMARY', response.data)
              return response
            })
          },
          fetchCompletion({ commit }) {
            return statisticServices.getTaskCompletionStatistics().then(response => {
              commit('SET_COMPLETION', response.data)
              return response
            })
          },
          fetchDaily({ commit }, params) {
            return statisticServices.getDailyTaskStatistics(params).then(response => {
              commit('SET_DAILY', response.data)
              return response
            })
          },
          fetchCategory({ commit }) {
            return statisticServices.getCategoryTaskStatistics().then(response => {
              commit('SET_CATEGORY', response.data)
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

describe('统计功能集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(statisticServices, 'getTaskStatistics').mockResolvedValue({
      data: {
        total_tasks: 100,
        completed_tasks: 75,
        pending_tasks: 25,
        completion_rate: 75.0
      }
    })

    jest.spyOn(statisticServices, 'getTaskCompletionStatistics').mockResolvedValue({
      data: {
        completed: 75,
        pending: 25
      }
    })

    jest.spyOn(statisticServices, 'getDailyTaskStatistics').mockResolvedValue({
      data: [
        { date: '2023-12-01', completed: 5, pending: 3 },
        { date: '2023-12-02', completed: 7, pending: 2 }
      ]
    })

    jest.spyOn(statisticServices, 'getCategoryTaskStatistics').mockResolvedValue({
      data: [
        { category: 'Work', count: 40 },
        { category: 'Personal', count: 30 },
        { category: 'Study', count: 30 }
      ]
    })

    jest.spyOn(taskServices, 'getTasks').mockResolvedValue({
      data: [
        { id: 1, title: 'Task 1' },
        { id: 2, title: 'Task 2' }
      ]
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以查看任务统计概览', async () => {
    // 获取统计概览
    await store.dispatch('statistics/fetchSummary')
    
    // 验证获取统计概览API被调用
    expect(statisticServices.getTaskStatistics).toHaveBeenCalled()
    
    // 验证统计数据
    expect(store.state.statistics.summary.total_tasks).toBe(100)
    expect(store.state.statistics.summary.completed_tasks).toBe(75)
    expect(store.state.statistics.summary.completion_rate).toBe(75.0)
  })

  it('用户可以查看任务完成情况统计', async () => {
    // 获取完成情况统计
    await store.dispatch('statistics/fetchCompletion')
    
    // 验证获取完成情况统计API被调用
    expect(statisticServices.getTaskCompletionStatistics).toHaveBeenCalled()
    
    // 验证统计数据
    expect(store.state.statistics.completion.completed).toBe(75)
    expect(store.state.statistics.completion.pending).toBe(25)
  })

  it('用户可以查看每日任务统计', async () => {
    // 获取每日任务统计
    await store.dispatch('statistics/fetchDaily', { days: 7 })
    
    // 验证获取每日任务统计API被调用
    expect(statisticServices.getDailyTaskStatistics).toHaveBeenCalledWith({ days: 7 })
    
    // 验证统计数据
    expect(store.state.statistics.daily).toHaveLength(2)
    expect(store.state.statistics.daily[0].date).toBe('2023-12-01')
    expect(store.state.statistics.daily[1].completed).toBe(7)
  })

  it('用户可以查看分类任务统计', async () => {
    // 获取分类任务统计
    await store.dispatch('statistics/fetchCategory')
    
    // 验证获取分类任务统计API被调用
    expect(statisticServices.getCategoryTaskStatistics).toHaveBeenCalled()
    
    // 验证统计数据
    expect(store.state.statistics.category).toHaveLength(3)
    expect(store.state.statistics.category[0].category).toBe('Work')
    expect(store.state.statistics.category[0].count).toBe(40)
  })
})