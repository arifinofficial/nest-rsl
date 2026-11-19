import { FrameworkConstants } from '../src/constants'

describe('FrameworkConstants', () => {
  it('has SortOrder.Ascending = ASC', () => {
    expect(FrameworkConstants.SortOrder.Ascending).toBe('ASC')
  })

  it('has SortOrder.Descending = DESC', () => {
    expect(FrameworkConstants.SortOrder.Descending).toBe('DESC')
  })

  it('has the FiltersNotAccepted message', () => {
    expect(FrameworkConstants.Messages.FiltersNotAccepted).toBe(
      'filters is no longer accepted from the request; set PagedSearchParameter.filters in the service (see CHANGELOG 0.2.0)',
    )
  })
})
