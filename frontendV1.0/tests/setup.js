import { config } from '@vue/test-utils'

config.global.mocks = {
  $message: jest.fn()
}