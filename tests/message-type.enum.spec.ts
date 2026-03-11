import { MessageType } from '../src/enums'

describe('MessageType', () => {
  it('has Error, Info, Warning values', () => {
    expect(MessageType.Error).toBe('Error')
    expect(MessageType.Info).toBe('Info')
    expect(MessageType.Warning).toBe('Warning')
  })
})
