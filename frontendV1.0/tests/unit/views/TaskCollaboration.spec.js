import { mount } from '@vue/test-utils'
import Vuex from 'vuex'
import TaskCollaboration from '@/views/TaskCollaboration.vue'
import { getTaskCollaborators, inviteCollaborator, removeCollaborator } from '@/services/tasks'

// Mock the task service functions
jest.mock('@/services/tasks')

// Create local vue instance
const localVue = createLocalVue()
localVue.use(Vuex)

describe('TaskCollaboration.vue', () => {
  let wrapper
  let store
  let actions
  
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks()
    
    // Mock actions
    actions = {
      setCurrentTask: jest.fn()
    }
    
    // Create mock store
    store = new Vuex.Store({
      state: {
        currentTask: {
          id: 1,
          title: 'Test Task',
          description: 'Test Description'
        }
      },
      actions
    })
    
    // Mount component
    wrapper = mount(TaskCollaboration, {
      global: {
        plugins: [store],
        mocks: {
          $route: {
            params: {
              id: '1'
            }
          },
          $router: {
            go: jest.fn()
          }
        }
      }
    })
  })
  
  afterEach(() => {
    wrapper.destroy()
  })
  
  it('should render task collaboration component', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('任务协同')
  })
  
  it('should display task information', () => {
    expect(wrapper.find('.task-info h2').text()).toBe('Test Task')
    expect(wrapper.find('.task-info p').text()).toBe('Test Description')
  })
  
  it('should load collaborators on mount', async () => {
    const mockCollaborators = {
      data: {
        items: [
          { id: 1, username: 'user1', permission: 'read' },
          { id: 2, username: 'user2', permission: 'write' }
        ]
      }
    }
    
    getTaskCollaborators.mockResolvedValue(mockCollaborators)
    
    // Trigger loadCollaborators method
    await wrapper.vm.loadCollaborators()
    
    expect(getTaskCollaborators).toHaveBeenCalledWith('1')
    expect(wrapper.vm.collaborators).toEqual(mockCollaborators.data.items)
  })
  
  it('should invite collaborator', async () => {
    const mockResponse = {
      data: {
        id: 3,
        username: 'newuser',
        permission: 'read'
      }
    }
    
    inviteCollaborator.mockResolvedValue(mockResponse)
    
    // Set form data
    wrapper.vm.inviteForm = {
      username: 'newuser',
      permission: 'read'
    }
    
    // Trigger invite collaborator method
    await wrapper.vm.inviteCollaborator()
    
    expect(inviteCollaborator).toHaveBeenCalledWith({
      task_id: '1',
      username: 'newuser',
      permission: 'read'
    })
  })
  
  it('should remove collaborator', async () => {
    const mockResponse = { data: {} }
    removeCollaborator.mockResolvedValue(mockResponse)
    
    // Mock confirm dialog
    window.confirm = jest.fn(() => true)
    
    // Trigger remove collaborator method
    await wrapper.vm.removeCollaborator({ id: 1, username: 'user1' })
    
    expect(removeCollaborator).toHaveBeenCalledWith('1', 1)
  })
  
  it('should go back when back button is clicked', async () => {
    const backButton = wrapper.find('.return-button')
    await backButton.trigger('click')
    
    expect($router.go).toHaveBeenCalledWith(-1)
  })
  
})