import { BasicResponse } from '../src/dto/response'

describe('BasicResponse', () => {
  let response: BasicResponse

  beforeEach(() => {
    response = new BasicResponse()
  })

  it('starts with no messages and no errors', () => {
    expect(response.isError()).toBe(false)
    expect(response.messages).toHaveLength(0)
  })

  it('isError returns true after addErrorMessage', () => {
    response.addErrorMessage('Something went wrong')
    expect(response.isError()).toBe(true)
  })

  it('isError returns false after addInfoMessage only', () => {
    response.addInfoMessage('All good')
    expect(response.isError()).toBe(false)
  })

  it('getMessageErrorTextArray returns only error messages', () => {
    response.addErrorMessage('error 1')
    response.addInfoMessage('info 1')
    expect(response.getMessageErrorTextArray()).toEqual(['error 1'])
  })

  it('getMessageInfoTextArray returns only info messages', () => {
    response.addInfoMessage('info 1')
    response.addErrorMessage('error 1')
    expect(response.getMessageInfoTextArray()).toEqual(['info 1'])
  })

  it('addWarningMessage does not cause isError', () => {
    response.addWarningMessage('warning')
    expect(response.isError()).toBe(false)
  })

  it('isContainInfo returns true after addInfoMessage', () => {
    response.addInfoMessage('something')
    expect(response.isContainInfo()).toBe(true)
  })
})
