import { PagedSearchParameter } from '../src/models'

describe('PagedSearchParameter', () => {
  describe('fromRequest', () => {
    it('maps all fields from a request object', () => {
      const request = {
        pageIndex: 2,
        pageSize: 10,
        orderByFieldName: 'name',
        sortOrder: 'DESC',
        keyword: 'test',
        filters: 'entity.active = :active',
        filtersVariable: { active: true },
      }

      const param = PagedSearchParameter.fromRequest(request as any)

      expect(param.pageIndex).toBe(2)
      expect(param.pageSize).toBe(10)
      expect(param.orderByFieldName).toBe('name')
      expect(param.sortOrder).toBe('DESC')
      expect(param.keyword).toBe('test')
      expect(param.filters).toBe('entity.active = :active')
      expect(param.filtersVariable).toEqual({ active: true })
    })

    it('maps optional fields as undefined when absent', () => {
      const request = { pageIndex: 0, pageSize: 20 }

      const param = PagedSearchParameter.fromRequest(request as any)

      expect(param.pageIndex).toBe(0)
      expect(param.pageSize).toBe(20)
      expect(param.orderByFieldName).toBeUndefined()
      expect(param.keyword).toBeUndefined()
    })
  })
})
