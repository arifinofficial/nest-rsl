import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { PagedSearchParameter } from '../src/models'
import { GenericRequest, PagedSearchRequest } from '../src/dto/request'
import {
  createHarness,
  SoftTodoRepository,
  SoftTodoService,
  TodoEntity,
} from './support/todo.fixture'

const FILTERS_NOT_ACCEPTED =
  'filters is no longer accepted from the request; set PagedSearchParameter.filters in the service (see CHANGELOG 0.2.0)'

class FilteredSoftTodoService extends SoftTodoService {
  protected getPagedSearchParameter(request: PagedSearchRequest): PagedSearchParameter {
    const parameter = super.getPagedSearchParameter(request)
    parameter.filters = 'entity.title = :wanted'
    parameter.filtersVariable = { wanted: 'keep' }
    return parameter
  }
}

describe('BaseService', () => {
  let dataSource: DataSource
  let softService: SoftTodoService
  let softRepo: SoftTodoRepository

  beforeEach(async () => {
    ;({ dataSource, softService, softRepo } = await createHarness())
  })

  afterEach(async () => {
    await dataSource.destroy()
  })

  const request = (id: string) => new GenericRequest<string>({ data: id })

  it('hardDelete returns "Data deleted successfully" with the DTO', async () => {
    await dataSource
      .getRepository(TodoEntity)
      .insert({ id: 'a1', title: 'x', is_deleted: true } as TodoEntity)

    const response = await softService.hardDelete(request('a1'))

    expect(response.isError()).toBe(false)
    expect(response.data).toMatchObject({
      id: 'a1',
      title: 'x',
      is_deleted: true,
    })
    expect(response.getMessageInfoTextArray()).toContain('Data deleted successfully')
    expect(await dataSource.getRepository(TodoEntity).count()).toBe(0)
  })

  it('hardDelete returns error "Item not found for deletion" for an unknown id', async () => {
    const response = await softService.hardDelete(request('missing'))

    expect(response.isError()).toBe(true)
    expect(response.getMessageErrorTextArray()).toContain('Item not found for deletion')
  })

  describe('pagedSearch', () => {
    const paged = (extra: Record<string, unknown> = {}) =>
      ({ pageIndex: 0, pageSize: 10, ...extra }) as PagedSearchRequest

    it('rejects a request carrying filters', async () => {
      const spy = vi.spyOn(softRepo, 'pagedSearch')

      const response = await softService.pagedSearch(
        paged({ filters: '1=1) OR (1=1', filtersVariable: {} }),
      )

      expect(response.isError()).toBe(true)
      expect(response.getMessageErrorTextArray()).toContain(FILTERS_NOT_ACCEPTED)
      expect(spy).not.toHaveBeenCalled()
    })

    it('rejects a request carrying only filtersVariable', async () => {
      const spy = vi.spyOn(softRepo, 'pagedSearch')

      const response = await softService.pagedSearch(paged({ filtersVariable: { a: 1 } }))

      expect(response.isError()).toBe(true)
      expect(response.getMessageErrorTextArray()).toContain(FILTERS_NOT_ACCEPTED)
      expect(spy).not.toHaveBeenCalled()
    })

    it('returns "Invalid orderByFieldName: ID" without querying', async () => {
      const spy = vi.spyOn(softRepo, 'pagedSearch')

      const response = await softService.pagedSearch(paged({ orderByFieldName: 'ID' }))

      expect(response.isError()).toBe(true)
      expect(response.getMessageErrorTextArray()).toContain('Invalid orderByFieldName: ID')
      expect(spy).not.toHaveBeenCalled()
    })

    it('searches normally with a valid orderByFieldName', async () => {
      const typeormRepo = dataSource.getRepository(TodoEntity)
      await typeormRepo.insert({ id: 'a1', title: 'b' } as TodoEntity)
      await typeormRepo.insert({ id: 'a2', title: 'a' } as TodoEntity)

      const response = await softService.pagedSearch(paged({ orderByFieldName: 'title' }))

      expect(response.isError()).toBe(false)
      expect(response.totalCount).toBe(2)
      expect(response.dtoCollection.map((d) => d.id)).toEqual(['a2', 'a1'])
    })

    it('filters set by an overridden getPagedSearchParameter are applied', async () => {
      const typeormRepo = dataSource.getRepository(TodoEntity)
      await typeormRepo.insert({ id: 'a1', title: 'keep' } as TodoEntity)
      await typeormRepo.insert({ id: 'a2', title: 'drop' } as TodoEntity)
      await typeormRepo.insert({ id: 'a3', title: 'keep', is_deleted: true } as TodoEntity)
      const service = new FilteredSoftTodoService(softRepo)

      const response = await service.pagedSearch(paged())

      expect(response.isError()).toBe(false)
      expect(response.totalCount).toBe(1)
      expect(response.dtoCollection.map((d) => d.id)).toEqual(['a1'])
    })
  })
})
