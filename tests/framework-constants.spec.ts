import { FrameworkConstants } from '../src/constants'

describe('FrameworkConstants', () => {
  it('has SortOrder.Ascending = ASC', () => {
    expect(FrameworkConstants.SortOrder.Ascending).toBe('ASC')
  })

  it('has SortOrder.Descending = DESC', () => {
    expect(FrameworkConstants.SortOrder.Descending).toBe('DESC')
  })
})
