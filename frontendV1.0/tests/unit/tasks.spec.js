import * as taskService from '@/services/tasks'
import * as categoryService from '@/services/categories'
import api from '@/services/api'

// Mock the API calls
jest.mock('@/services/api')

describe('Task Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Task CRUD operations', () => {
    it('should fetch tasks with parameters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, title: 'Task 1', status: 'pending' },
            { id: 2, title: 'Task 2', status: 'completed' }
          ],
          total: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { status: 'pending', limit: 10 }
      const result = await taskService.getTasks(params)
      
      expect(api.get).toHaveBeenCalledWith('/tasks/', { params })
      expect(result).toEqual(mockResponse)
    })

    it('should fetch a specific task', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'Task 1',
          description: 'Description 1',
          status: 'pending'
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await taskService.getTask(1)
      
      expect(api.get).toHaveBeenCalledWith('/tasks/1')
      expect(result).toEqual(mockResponse)
    })

    it('should create a new task', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'New Task',
          description: 'New Description',
          status: 'pending'
        }
      }
      
      const taskData = {
        title: 'New Task',
        description: 'New Description',
        priority: 'medium'
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const result = await taskService.createTask(taskData)
      
      expect(api.post).toHaveBeenCalledWith('/tasks/', taskData)
      expect(result).toEqual(mockResponse)
    })

    it('should update a task', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'Updated Task',
          description: 'Updated Description',
          status: 'completed'
        }
      }
      
      const taskData = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'completed'
      }
      
      api.put.mockResolvedValue(mockResponse)
      
      const result = await taskService.updateTask(1, taskData)
      
      expect(api.put).toHaveBeenCalledWith('/tasks/1', taskData)
      expect(result).toEqual(mockResponse)
    })

    it('should delete a task', async () => {
      api.delete.mockResolvedValue()
      
      await taskService.deleteTask(1)
      
      expect(api.delete).toHaveBeenCalledWith('/tasks/1')
    })
  })

  describe('Trash operations', () => {
    it('should fetch deleted tasks', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, title: 'Deleted Task 1', status: 'deleted' }
          ],
          total: 1
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { status: 'deleted' }
      const result = await taskService.getDeletedTasks(params)
      
      expect(api.get).toHaveBeenCalledWith('/tasks/deleted', { params })
      expect(result).toEqual(mockResponse)
    })

    it('should restore a deleted task', async () => {
      const mockResponse = {
        data: {
          id: 1,
          title: 'Restored Task',
          status: 'pending'
        }
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const result = await taskService.restoreTask(1)
      
      expect(api.post).toHaveBeenCalledWith('/tasks/deleted/1/restore')
      expect(result).toEqual(mockResponse)
    })

    it('should permanently delete a task', async () => {
      api.delete.mockResolvedValue()
      
      await taskService.permanentlyDeleteTask(1)
      
      expect(api.delete).toHaveBeenCalledWith('/tasks/deleted/1')
    })
  })

  describe('Batch operations', () => {
    it('should batch update tasks', async () => {
      const mockResponse = {
        data: {
          updated: 2
        }
      }
      
      const batchData = {
        task_ids: [1, 2],
        priority: 'high'
      }
      
      api.put.mockResolvedValue(mockResponse)
      
      const result = await taskService.batchUpdateTasks(batchData)
      
      expect(api.put).toHaveBeenCalledWith('/tasks/batch', batchData)
      expect(result).toEqual(mockResponse)
    })

    it('should batch delete tasks', async () => {
      const mockResponse = {
        data: {
          deleted: 2
        }
      }
      
      const taskIds = [1, 2]
      
      api.delete.mockResolvedValue(mockResponse)
      
      const result = await taskService.batchDeleteTasks(taskIds)
      
      expect(api.delete).toHaveBeenCalledWith('/tasks/batch', { data: { task_ids: taskIds } })
      expect(result).toEqual(mockResponse)
    })
  })

  describe('Export operations', () => {
    it('should export tasks to CSV', async () => {
      const mockResponse = {
        data: 'csv,data,content'
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { status: 'completed' }
      const result = await taskService.exportTasksToCSV(params)
      
      expect(api.get).toHaveBeenCalledWith('/tasks/export/csv', { 
        params, 
        responseType: 'blob' 
      })
      expect(result).toEqual(mockResponse)
    })
  })
  
  describe('Statistics operations', () => {
    it('should fetch task statistics summary', async () => {
      const mockResponse = {
        data: {
          total_tasks: 10,
          completed_tasks: 5,
          pending_tasks: 3,
          in_progress_tasks: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await taskService.getTaskStatistics()
      
      expect(api.get).toHaveBeenCalledWith('/statistics/summary')
      expect(result).toEqual(mockResponse)
    })
    
    it('should fetch task completion statistics', async () => {
      const mockResponse = {
        data: {
          completion_rate: 0.5,
          completed_count: 5,
          total_count: 10
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await taskService.getTaskCompletionStatistics()
      
      expect(api.get).toHaveBeenCalledWith('/statistics/tasks/completion')
      expect(result).toEqual(mockResponse)
    })
    
    it('should fetch daily task statistics', async () => {
      const mockResponse = {
        data: [
          { date: '2023-01-01', completed: 2, total: 5 },
          { date: '2023-01-02', completed: 3, total: 5 }
        ]
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { days: 7 }
      const result = await taskService.getDailyTaskStatistics(params)
      
      expect(api.get).toHaveBeenCalledWith('/statistics/tasks/daily', { params })
      expect(result).toEqual(mockResponse)
    })
    
    it('should fetch category task statistics', async () => {
      const mockResponse = {
        data: [
          { category: 'Work', count: 5 },
          { category: 'Personal', count: 3 }
        ]
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await taskService.getCategoryTaskStatistics()
      
      expect(api.get).toHaveBeenCalledWith('/statistics/tasks/category')
      expect(result).toEqual(mockResponse)
    })
    
    it('should fetch priority task statistics', async () => {
      const mockResponse = {
        data: {
          high: 2,
          medium: 5,
          low: 3
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await taskService.getPriorityTaskStatistics()
      
      expect(api.get).toHaveBeenCalledWith('/statistics/tasks/priority')
      expect(result).toEqual(mockResponse)
    })
    
    it('should fetch overdue task statistics', async () => {
      const mockResponse = {
        data: {
          overdue_count: 2,
          total_count: 10
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await taskService.getOverdueTaskStatistics()
      
      expect(api.get).toHaveBeenCalledWith('/statistics/tasks/overdue')
      expect(result).toEqual(mockResponse)
    })
  })
})

describe('Category Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Category CRUD operations', () => {
    it('should fetch categories with parameters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, name: 'Work' },
            { id: 2, name: 'Personal' }
          ],
          total: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { limit: 10 }
      const result = await categoryService.getCategories(params)
      
      expect(api.get).toHaveBeenCalledWith('/tasks/categories', { params })
      expect(result).toEqual(mockResponse)
    })

    it('should create a new category', async () => {
      const mockResponse = {
        data: {
          id: 1,
          name: 'New Category',
          description: 'Category Description'
        }
      }
      
      const categoryData = {
        name: 'New Category',
        description: 'Category Description'
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const result = await categoryService.createCategory(categoryData)
      
      expect(api.post).toHaveBeenCalledWith('/tasks/categories', categoryData)
      expect(result).toEqual(mockResponse)
    })

    it('should update a category', async () => {
      const mockResponse = {
        data: {
          id: 1,
          name: 'Updated Category',
          description: 'Updated Description'
        }
      }
      
      const categoryData = {
        name: 'Updated Category',
        description: 'Updated Description'
      }
      
      api.put.mockResolvedValue(mockResponse)
      
      const result = await categoryService.updateCategory(1, categoryData)
      
      expect(api.put).toHaveBeenCalledWith('/tasks/categories/1', categoryData)
      expect(result).toEqual(mockResponse)
    })

    it('should delete a category', async () => {
      api.delete.mockResolvedValue()
      
      await categoryService.deleteCategory(1)
      
      expect(api.delete).toHaveBeenCalledWith('/tasks/categories/1')
    })
  })
})