import * as reminderService from '@/services/reminders'
import api from '@/services/api'

// Mock the API calls
jest.mock('@/services/api')

describe('Reminder Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Reminder CRUD operations', () => {
    it('should fetch reminders with parameters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' },
            { id: 2, task_id: 2, reminder_time: '2023-01-02T10:00:00Z' }
          ],
          total: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { task_id: 1, limit: 10 }
      const result = await reminderService.getReminders(params)
      
      expect(api.get).toHaveBeenCalledWith('/reminders/', { params })
      expect(result).toEqual(mockResponse)
    })

    it('should fetch a specific reminder', async () => {
      const mockResponse = {
        data: {
          id: 1,
          task_id: 1,
          reminder_time: '2023-01-01T10:00:00Z'
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await reminderService.getReminder(1)
      
      expect(api.get).toHaveBeenCalledWith('/reminders/1')
      expect(result).toEqual(mockResponse)
    })

    it('should fetch task reminders with parameters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, task_id: 1, reminder_time: '2023-01-01T10:00:00Z' },
            { id: 2, task_id: 1, reminder_time: '2023-01-02T10:00:00Z' }
          ],
          total: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const taskId = 1
      const params = { limit: 10 }
      const result = await reminderService.getTaskReminders(taskId, params)
      
      expect(api.get).toHaveBeenCalledWith(`/reminders/tasks/${taskId}`, { params })
      expect(result).toEqual(mockResponse)
    })

    it('should create a new reminder', async () => {
      const mockResponse = {
        data: {
          id: 1,
          task_id: 1,
          reminder_time: '2023-01-01T10:00:00Z'
        }
      }
      
      const reminderData = {
        task_id: 1,
        reminder_time: '2023-01-01T10:00:00Z',
        reminder_type: 'once',
        method: 'popup'
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const result = await reminderService.createReminder(reminderData)
      
      expect(api.post).toHaveBeenCalledWith('/reminders/', reminderData)
      expect(result).toEqual(mockResponse)
    })

    it('should update a reminder', async () => {
      const mockResponse = {
        data: {
          id: 1,
          task_id: 1,
          reminder_time: '2023-01-01T11:00:00Z'
        }
      }
      
      const reminderData = {
        reminder_time: '2023-01-01T11:00:00Z'
      }
      
      api.put.mockResolvedValue(mockResponse)
      
      const result = await reminderService.updateReminder(1, reminderData)
      
      expect(api.put).toHaveBeenCalledWith('/reminders/1', reminderData)
      expect(result).toEqual(mockResponse)
    })

    it('should delete a reminder', async () => {
      api.delete.mockResolvedValue()
      
      await reminderService.deleteReminder(1)
      
      expect(api.delete).toHaveBeenCalledWith('/reminders/1')
    })
  })
  
  describe('Reminder activation operations', () => {
    it('should activate a reminder', async () => {
      api.post.mockResolvedValue()
      
      await reminderService.activateReminder(1)
      
      expect(api.post).toHaveBeenCalledWith('/reminders/1/activate')
    })
    
    it('should deactivate a reminder', async () => {
      api.post.mockResolvedValue()
      
      await reminderService.deactivateReminder(1)
      
      expect(api.post).toHaveBeenCalledWith('/reminders/1/deactivate')
    })
  })
})