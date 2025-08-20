import * as commentService from '@/services/comments'
import api from '@/services/api'

// Mock the API calls
jest.mock('@/services/api')

describe('Comment Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('Comment CRUD operations', () => {
    it('should fetch comments with parameters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, content: 'Comment 1', task_id: 1 },
            { id: 2, content: 'Comment 2', task_id: 1 }
          ],
          total: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const params = { task_id: 1, limit: 10 }
      const result = await commentService.getComments(params)
      
      expect(api.get).toHaveBeenCalledWith('/comments/', { params })
      expect(result).toEqual(mockResponse)
    })

    it('should fetch a specific comment', async () => {
      const mockResponse = {
        data: {
          id: 1,
          content: 'Comment 1',
          task_id: 1
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const result = await commentService.getComment(1)
      
      expect(api.get).toHaveBeenCalledWith('/comments/1')
      expect(result).toEqual(mockResponse)
    })

    it('should fetch task comments with parameters', async () => {
      const mockResponse = {
        data: {
          items: [
            { id: 1, content: 'Comment 1', task_id: 1 },
            { id: 2, content: 'Comment 2', task_id: 1 }
          ],
          total: 2
        }
      }
      
      api.get.mockResolvedValue(mockResponse)
      
      const taskId = 1
      const params = { limit: 10 }
      const result = await commentService.getTaskComments(taskId, params)
      
      expect(api.get).toHaveBeenCalledWith(`/comments/task/${taskId}`, { params })
      expect(result).toEqual(mockResponse)
    })

    it('should create a new comment', async () => {
      const mockResponse = {
        data: {
          id: 1,
          content: 'New Comment',
          task_id: 1
        }
      }
      
      const commentData = {
        task_id: 1,
        content: 'New Comment'
      }
      
      api.post.mockResolvedValue(mockResponse)
      
      const result = await commentService.createComment(commentData)
      
      expect(api.post).toHaveBeenCalledWith('/comments/', commentData)
      expect(result).toEqual(mockResponse)
    })

    it('should update a comment', async () => {
      const mockResponse = {
        data: {
          id: 1,
          content: 'Updated Comment',
          task_id: 1
        }
      }
      
      const commentData = {
        content: 'Updated Comment'
      }
      
      api.put.mockResolvedValue(mockResponse)
      
      const result = await commentService.updateComment(1, commentData)
      
      expect(api.put).toHaveBeenCalledWith('/comments/1', commentData)
      expect(result).toEqual(mockResponse)
    })

    it('should delete a comment', async () => {
      api.delete.mockResolvedValue()
      
      await commentService.deleteComment(1)
      
      expect(api.delete).toHaveBeenCalledWith('/comments/1')
    })
  })
})