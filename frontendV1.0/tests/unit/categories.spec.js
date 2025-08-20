import * as categoryService from '@/services/categories'
import api from '@/services/api'

// Mock the API calls
jest.mock('@/services/api')

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
            { id: 1, name: 'Work', description: 'Work tasks' },
            { id: 2, name: 'Personal', description: 'Personal tasks' }
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