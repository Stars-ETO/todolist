import { createStore } from 'vuex'
import * as taskServices from '@/services/tasks'
import * as commentServices from '@/services/comments'

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
          }
        }
      },
      comments: {
        namespaced: true,
        state: {
          comments: []
        },
        mutations: {
          SET_COMMENTS(state, comments) {
            state.comments = comments
          }
        },
        actions: {
          fetchComments({ commit }, taskId) {
            return commentServices.getTaskComments(taskId).then(response => {
              commit('SET_COMMENTS', response.data)
              return response
            })
          },
          addComment({ dispatch }, { taskId, content }) {
            return commentServices.createComment({ task: taskId, content }).then(response => {
              dispatch('fetchComments', taskId)
              return response
            })
          }
        }
      }
    }
  })
}

describe('协同功能集成测试', () => {
  let store

  beforeEach(() => {
    store = createTestStore()
    
    // Mock API调用
    jest.spyOn(taskServices, 'getTasks').mockResolvedValue({
      data: [
        { id: 1, title: 'Public Task 1', description: 'Description 1', is_public: true },
        { id: 2, title: 'Private Task 2', description: 'Description 2', is_public: false }
      ]
    })

    jest.spyOn(taskServices, 'getTask').mockImplementation((taskId) => {
      if (taskId === 1) {
        return Promise.resolve({
          data: { id: 1, title: 'Public Task 1', description: 'Description 1', is_public: true }
        })
      }
    })

    jest.spyOn(commentServices, 'getTaskComments').mockResolvedValue({
      data: [
        { id: 1, task: 1, content: 'This is a comment', author: 'testuser' },
        { id: 2, task: 1, content: 'This is another comment', author: 'otheruser' }
      ]
    })

    jest.spyOn(commentServices, 'createComment').mockResolvedValue({
      data: { id: 3, task: 1, content: 'New comment', author: 'testuser' }
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('用户可以查看公开任务', async () => {
    // 获取任务列表
    await store.dispatch('tasks/fetchTasks')
    
    // 验证获取任务API被调用
    expect(taskServices.getTasks).toHaveBeenCalled()
    
    // 验证任务列表显示
    expect(store.state.tasks.tasks).toHaveLength(2)
    expect(store.state.tasks.tasks[0].is_public).toBe(true)
  })

  it('用户可以在公开任务下添加评论', async () => {
    // 添加评论
    await store.dispatch('comments/addComment', {
      taskId: 1,
      content: 'New comment'
    })

    // 验证添加评论API被调用
    expect(commentServices.createComment).toHaveBeenCalledWith({
      task: 1,
      content: 'New comment'
    })

    // 验证评论列表已更新
    expect(commentServices.getTaskComments).toHaveBeenCalledWith(1)
  })

  it('用户可以查看任务的评论', async () => {
    // 获取任务评论
    await store.dispatch('comments/fetchComments', 1)
    
    // 验证获取评论API被调用
    expect(commentServices.getTaskComments).toHaveBeenCalledWith(1)
    
    // 验证评论列表显示
    expect(store.state.comments.comments).toHaveLength(2)
    expect(store.state.comments.comments[0].content).toBe('This is a comment')
    expect(store.state.comments.comments[1].author).toBe('otheruser')
  })
})