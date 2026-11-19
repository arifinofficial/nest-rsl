import { DataSource } from 'typeorm'
import { createHarness, TodoDto, TodoRepository } from './support/todo.fixture'

describe('BaseRepository', () => {
  describe('without softDeleteColumn', () => {
    let dataSource: DataSource
    let todoRepo: TodoRepository

    beforeEach(async () => {
      ;({ dataSource, todoRepo } = await createHarness())
    })

    afterEach(async () => {
      await dataSource.destroy()
    })

    it('inserts and reads a row with a string id and a DTO without audit fields', async () => {
      await todoRepo.insert({ id: 'a1', title: 'x' } as TodoDto)

      const dto = await todoRepo.read('a1')

      expect(dto).toMatchObject({ id: 'a1', title: 'x' })
    })

    it('delete removes the row and returns the DTO as it was', async () => {
      await todoRepo.insert({ id: 'a1', title: 'x' } as TodoDto)

      const dto = await todoRepo.delete('a1')

      expect(dto?.title).toBe('x')
      expect(await dataSource.getRepository('TodoEntity').count()).toBe(0)
    })

    it('hardDelete equals delete when softDeleteColumn is unset', async () => {
      await todoRepo.insert({ id: 'a1', title: 'x' } as TodoDto)

      const dto = await todoRepo.hardDelete('a1')

      expect(dto?.title).toBe('x')
      expect(await dataSource.getRepository('TodoEntity').count()).toBe(0)
      expect(await todoRepo.hardDelete('a1')).toBeNull()
    })

    it('read/delete return null for an unknown id', async () => {
      expect(await todoRepo.read('missing')).toBeNull()
      expect(await todoRepo.delete('missing')).toBeNull()
    })
  })
})
