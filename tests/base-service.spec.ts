import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { GenericRequest } from '../src/dto/request'
import { createHarness, SoftTodoService, TodoEntity } from './support/todo.fixture'

describe('BaseService', () => {
  let dataSource: DataSource
  let softService: SoftTodoService

  beforeEach(async () => {
    ;({ dataSource, softService } = await createHarness())
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
})
