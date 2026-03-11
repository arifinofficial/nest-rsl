import { GenericResponse } from '../src/dto/response'

describe('GenericResponse<T>', () => {
  it('holds a typed data value', () => {
    const response = new GenericResponse<string>()
    response.data = 'hello'
    expect(response.data).toBe('hello')
  })

  it('inherits BasicResponse methods', () => {
    const response = new GenericResponse<number>()
    response.addErrorMessage('oops')
    expect(response.isError()).toBe(true)
  })
})
