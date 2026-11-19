import { FrameworkConstants } from '../src/constants/framework.constants'
import { PagedSearchParameter } from '../src/models'

describe('PagedSearchParameter', () => {
  describe('fromRequest', () => {
    it('maps request fields', () => {
      const request = {
        pageIndex: 2,
        pageSize: 10,
        orderByFieldName: 'name',
        sortOrder: 'DESC',
        keyword: 'test',
      }

      const param = PagedSearchParameter.fromRequest(request)

      expect(param.pageIndex).toBe(2)
      expect(param.pageSize).toBe(10)
      expect(param.orderByFieldName).toBe('name')
      expect(param.sortOrder).toBe('DESC')
      expect(param.keyword).toBe('test')
      expect(param.filters).toBeUndefined()
      expect(param.filtersVariable).toBeUndefined()
    })

    it('throws FiltersNotAccepted when filters is not empty', () => {
      expect(() =>
        PagedSearchParameter.fromRequest({
          pageIndex: 0,
          pageSize: 10,
          filters: 'entity.active = :active',
        }),
      ).toThrow(FrameworkConstants.Messages.FiltersNotAccepted)
    })

    it('throws FiltersNotAccepted when only filtersVariable is not empty', () => {
      expect(() =>
        PagedSearchParameter.fromRequest({
          pageIndex: 0,
          pageSize: 10,
          filtersVariable: { active: true },
        }),
      ).toThrow(FrameworkConstants.Messages.FiltersNotAccepted)
    })

    it('ignores empty-string and null filters as before', () => {
      const param = PagedSearchParameter.fromRequest({
        pageIndex: 0,
        pageSize: 10,
        filters: '',
        filtersVariable: null,
      })

      expect(param.filters).toBeUndefined()
      expect(param.filtersVariable).toBeUndefined()
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
