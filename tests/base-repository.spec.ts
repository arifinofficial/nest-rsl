import { DataSource } from 'typeorm'
import {
  createHarness,
  SoftTodoRepository,
  TodoDto,
  TodoEntity,
  TodoRepository,
} from './support/todo.fixture'

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

  describe('with softDeleteColumn', () => {
    let dataSource: DataSource
    let softRepo: SoftTodoRepository

    const seed = async (id: string, title: string, isDeleted: boolean) => {
      await dataSource
        .getRepository(TodoEntity)
        .insert({ id, title, is_deleted: isDeleted } as TodoEntity)
    }

    beforeEach(async () => {
      ;({ dataSource, softRepo } = await createHarness())
    })

    afterEach(async () => {
      await dataSource.destroy()
    })

    it('a row inserted without is_deleted is live and readable', async () => {
      await dataSource.query(`INSERT INTO todo (id, title) VALUES ('a1', 'x')`)

      const dto = await softRepo.read('a1')

      expect(dto).toMatchObject({ id: 'a1', title: 'x', is_deleted: false })
    })

    it('read ignores soft-deleted rows', async () => {
      await seed('a1', 'x', true)

      expect(await softRepo.read('a1')).toBeNull()
    })

    it('update returns null for a soft-deleted row and leaves it unchanged', async () => {
      await seed('a1', 'x', true)

      const dto = await softRepo.update({
        id: 'a1',
        title: 'changed',
      } as TodoDto)

      expect(dto).toBeNull()
      expect(await dataSource.getRepository(TodoEntity).findOneBy({ id: 'a1' })).toMatchObject({
        id: 'a1',
        title: 'x',
        is_deleted: true,
      })
    })

    it('delete sets is_deleted=true, keeps the row, returns the DTO as it was', async () => {
      await seed('a1', 'x', false)

      const dto = await softRepo.delete('a1')

      expect(dto).toMatchObject({ id: 'a1', title: 'x', is_deleted: false })
      const typeormRepo = dataSource.getRepository(TodoEntity)
      expect(await typeormRepo.count()).toBe(1)
      expect(await typeormRepo.findOneBy({ id: 'a1' })).toMatchObject({
        id: 'a1',
        title: 'x',
        is_deleted: true,
      })
    })

    it('delete writes no other DTO field but updates updated_at', async () => {
      await seed('a1', 'x', false)
      await dataSource.query(`UPDATE todo SET updated_at = '2000-01-01 00:00:00' WHERE id = 'a1'`)

      await softRepo.delete('a1')

      const row = await dataSource.getRepository(TodoEntity).findOneByOrFail({ id: 'a1' })
      expect(row.title).toBe('x')
      expect(row.is_deleted).toBe(true)
      expect(row.updated_at.getTime()).toBeGreaterThan(new Date('2000-01-01T00:00:00Z').getTime())
    })

    it('delete returns null for an already soft-deleted row', async () => {
      await seed('a1', 'x', true)

      expect(await softRepo.delete('a1')).toBeNull()
    })

    it('hardDelete removes a soft-deleted row', async () => {
      await seed('a1', 'x', true)

      const dto = await softRepo.hardDelete('a1')

      expect(dto).toMatchObject({ id: 'a1', title: 'x', is_deleted: true })
      expect(await dataSource.getRepository(TodoEntity).count()).toBe(0)
    })

    it('pagedSearch returns only live rows and totalCount excludes deleted rows, also with pageSize -1', async () => {
      await seed('a1', 'live one', false)
      await seed('a2', 'dead one', true)
      await seed('a3', 'live two', false)

      for (const pageSize of [10, -1]) {
        const { count, result } = await softRepo.pagedSearch({
          pageIndex: 0,
          pageSize,
        } as any)

        expect(count).toBe(2)
        expect(result.map((r) => r.id)).toEqual(['a1', 'a3'])
      }
    })
  })
})
