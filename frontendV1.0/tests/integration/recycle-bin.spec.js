import { createStore } from 'vuex'
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
      tasks: {
        namespaced: true,
        state: {
          tasks: [],
          deletedTasks: []
        },
        mutations: {
          SET_TASKS(state, tasks) {
            state.tasks = tasks
          },
          SET_DELETED_TASKS(state, tasks) {
            state.deletedTasks = tasks
          }
        },
        actions: {
          fetchTasks({ commit }) {
            return taskServices.getTasks().then(response => {
              commit('SET_TASKS', response.data)
              return response
            })
          },
          fetchDeletedTasks({ commit }) {
            return taskServices.getDeletedTasks().then(response => {
              commit('SET_DELETED_TASKS', response.data)
              return response
            })
          },
          deleteTask({ dispatch }, taskId) {
            return taskServices.deleteTask(taskId).then(response => {
              dispatch('fetchTasks')
              return response
            })
          },
          restoreTask({ dispatch }, taskId) {
            return taskServices.restoreTask(taskId).then(response => {
              dispatch('fetchDeletedTasks')
              dispatch('fetchTasks')
              return response
            })
          },
          permanentlyDeleteTask({ dispatch }, taskId) {
            return taskServices.permanentlyDeleteTask(taskId).then(response => {
              dispatch('fetchDeletedTasks')
              return response
            })
          }
        }
      }
    }
  })
}

describe('回收站功能集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(taskServices, 'getTasks').mockResolvedValue({
      data: [
        { id: 1, title: 'Existing Task 1', description: 'Description 1', completed: false },
        { id: 2, title: 'Existing Task 2', description: 'Description 2', completed: true }
      ]
    })

    jest.spyOn(taskServices, 'getDeletedTasks').mockResolvedValue({
      data: [
        { id: 3, title: 'Deleted Task 1', description: 'Deleted Description 1', deleted_at: '2023-01-01' },
        { id: 4, title: 'Deleted Task 2', description: 'Deleted Description 2', deleted_at: '2023-01-02' }
      ]
    })

    jest.spyOn(taskServices, 'deleteTask').mockResolvedValue({})

    jest.spyOn(taskServices, 'restoreTask').mockResolvedValue({})

    jest.spyOn(taskServices, 'permanentlyDeleteTask').mockResolvedValue({})
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以删除任务并查看回收站', async () => {
    // 删除任务
    await store.dispatch('tasks/deleteTask', 1)

    // 验证删除任务API被调用
    expect(taskServices.deleteTask).toHaveBeenCalledWith(1)

    // 获取回收站任务
    await store.dispatch('tasks/fetchDeletedTasks')
    
    // 验证获取回收站任务API被调用
    expect(taskServices.getDeletedTasks).toHaveBeenCalled()
    
    // 验证回收站任务列表显示
    expect(store.state.tasks.deletedTasks).toHaveLength(2)
    expect(store.state.tasks.deletedTasks[0].title).toBe('Deleted Task 1')
    expect(store.state.tasks.deletedTasks[1].title).toBe('Deleted Task 2')
  })

  it('用户可以从回收站恢复任务', async () => {
    // 模拟已有回收站任务
    store.commit('tasks/SET_DELETED_TASKS', [
      { id: 3, title: 'Deleted Task 1', description: 'Deleted Description 1', deleted_at: '2023-01-01' }
    ])

    // 恢复任务
    await store.dispatch('tasks/restoreTask', 3)

    // 验证恢复任务API被调用
    expect(taskServices.restoreTask).toHaveBeenCalledWith(3)

    // 验证任务列表和回收站都已更新
    expect(taskServices.getDeletedTasks).toHaveBeenCalled()
    expect(taskServices.getTasks).toHaveBeenCalled()
  })

  it('用户可以永久删除回收站中的任务', async () => {
    // 模拟已有回收站任务
    store.commit('tasks/SET_DELETED_TASKS', [
      { id: 4, title: 'Deleted Task 2', description: 'Deleted Description 2', deleted_at: '2023-01-02' }
    ])

    // 永久删除任务
    await store.dispatch('tasks/permanentlyDeleteTask', 4)

    // 验证永久删除任务API被调用
    expect(taskServices.permanentlyDeleteTask).toHaveBeenCalledWith(4)

    // 验证回收站已更新
    expect(taskServices.getDeletedTasks).toHaveBeenCalled()
  })
})