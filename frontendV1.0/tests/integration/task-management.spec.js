import { createStore } from 'vuex'
import * as taskServices from '@/services/tasks'
import * as categoryServices from '@/services/categories'

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
          task: null
        },
        mutations: {
          SET_TASKS(state, tasks) {
            state.tasks = tasks
          },
          SET_TASK(state, task) {
            state.task = task
          }
        },
        actions: {
          fetchTasks({ commit }) {
            return taskServices.getTasks().then(response => {
              commit('SET_TASKS', response.data)
              return response
            })
          },
          fetchTask({ commit }, taskId) {
            return taskServices.getTask(taskId).then(response => {
              commit('SET_TASK', response.data)
              return response
            })
          },
          createTask({ dispatch }, taskData) {
            return taskServices.createTask(taskData).then(response => {
              dispatch('fetchTasks')
              return response
            })
          },
          updateTask({ dispatch }, { id, data }) {
            return taskServices.updateTask(id, data).then(response => {
              dispatch('fetchTasks')
              return response
            })
          },
          deleteTask({ dispatch }, taskId) {
            return taskServices.deleteTask(taskId).then(response => {
              dispatch('fetchTasks')
              return response
            })
          },
          toggleTaskCompletion({ dispatch, state }, taskId) {
            // 查找当前任务
            const task = state.tasks.find(t => t.id === taskId)
            if (task) {
              // 切换任务完成状态
              return taskServices.updateTask(taskId, { completed: !task.completed }).then(response => {
                dispatch('fetchTasks')
                return response
              })
            }
          }
        }
      },
      categories: {
        namespaced: true,
        state: {
          categories: []
        },
        mutations: {
          SET_CATEGORIES(state, categories) {
            state.categories = categories
          }
        },
        actions: {
          fetchCategories({ commit }) {
            return categoryServices.getCategories().then(response => {
              commit('SET_CATEGORIES', response.data)
              return response
            })
          }
        }
      }
    }
  })
}

describe('任务管理集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(taskServices, 'getTasks').mockResolvedValue({
      data: [
        { id: 1, title: 'Existing Task 1', description: 'Description 1', completed: false, category: null },
        { id: 2, title: 'Existing Task 2', description: 'Description 2', completed: true, category: null }
      ]
    })

    jest.spyOn(taskServices, 'getTask').mockImplementation((taskId) => {
      if (taskId === 1) {
        return Promise.resolve({
          data: { id: 1, title: 'Existing Task 1', description: 'Description 1', completed: false, category: null }
        })
      } else if (taskId === 3) {
        return Promise.resolve({
          data: { id: 3, title: 'New Task', description: 'New Description', completed: false, category: null }
        })
      }
    })

    jest.spyOn(taskServices, 'createTask').mockResolvedValue({
      data: { id: 3, title: 'New Task', description: 'New Description', completed: false, category: null }
    })

    jest.spyOn(taskServices, 'updateTask').mockResolvedValue({
      data: { id: 1, title: 'Updated Task 1', description: 'Updated Description 1', completed: false, category: null }
    })

    jest.spyOn(taskServices, 'deleteTask').mockResolvedValue({})

    jest.spyOn(categoryServices, 'getCategories').mockResolvedValue({
      data: [
        { id: 1, name: 'Work', description: 'Work related tasks' },
        { id: 2, name: 'Personal', description: 'Personal tasks' }
      ]
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以创建任务', async () => {
    // 创建任务
    await store.dispatch('tasks/createTask', {
      title: 'New Task',
      description: 'New Description'
    })

    // 验证创建任务API被调用
    expect(taskServices.createTask).toHaveBeenCalledWith({
      title: 'New Task',
      description: 'New Description'
    })

    // 验证任务列表已更新
    expect(taskServices.getTasks).toHaveBeenCalled()
  })

  it('用户可以查看任务列表', async () => {
    // 获取任务列表
    await store.dispatch('tasks/fetchTasks')
    expect(taskServices.getTasks).toHaveBeenCalled()
    expect(store.state.tasks.tasks).toHaveLength(2)
  })

  it('用户可以查看任务详情', async () => {
    // 获取任务详情
    await store.dispatch('tasks/fetchTask', 3)
    expect(taskServices.getTask).toHaveBeenCalledWith(3)
    expect(store.state.tasks.task.title).toBe('New Task')
  })

  it('用户可以编辑任务', async () => {
    // 更新任务
    await store.dispatch('tasks/updateTask', {
      id: 1,
      data: {
        title: 'Updated Task 1',
        description: 'Updated Description 1'
      }
    })

    // 验证更新任务API被调用
    expect(taskServices.updateTask).toHaveBeenCalledWith(1, {
      title: 'Updated Task 1',
      description: 'Updated Description 1'
    })

    // 验证任务列表已更新
    expect(taskServices.getTasks).toHaveBeenCalled()
  })

  it('用户可以将任务标记为完成', async () => {
    // 设置初始任务状态
    store.commit('tasks/SET_TASKS', [
      { id: 1, title: 'Existing Task 1', description: 'Description 1', completed: false, category: null }
    ])

    // 将任务标记为完成
    await store.dispatch('tasks/toggleTaskCompletion', 1)
    
    // 验证更新任务完成状态API被调用
    expect(taskServices.updateTask).toHaveBeenCalledWith(1, { completed: true })

    // 验证任务列表已更新
    expect(taskServices.getTasks).toHaveBeenCalled()
  })

  it('用户可以删除任务', async () => {
    // 删除任务
    await store.dispatch('tasks/deleteTask', 1)

    // 验证删除任务API被调用
    expect(taskServices.deleteTask).toHaveBeenCalledWith(1)

    // 验证任务列表已更新
    expect(taskServices.getTasks).toHaveBeenCalled()
  })
})