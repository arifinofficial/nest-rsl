'use strict'
// Plain CommonJS on purpose: proves dist/index.js loads and works on the old stack.
require('reflect-metadata')
const assert = require('node:assert/strict')
const { DataSource, EntitySchema } = require('typeorm')
const { NestFactory } = require('@nestjs/core')
const { Module } = require('@nestjs/common')
const { BaseRepository, FrameworkModule } = require('@fintastic/nest-rsl')

class Todo {}
class TodoDto {}

const TodoSchema = new EntitySchema({
  name: 'Todo',
  target: Todo,
  tableName: 'todo',
  columns: {
    id: { type: 'varchar', primary: true },
    title: { type: 'varchar' },
    is_deleted: { type: 'boolean', default: false },
  },
})

class TodoRepository extends BaseRepository {
  constructor(repository) {
    // Placeholder mapper: entityToDto/dtoToEntity are overridden, so it is never used.
    super(repository, {}, Todo, TodoDto)
    this.softDeleteColumn = 'is_deleted'
  }
  entityToDto(entity) {
    return Object.assign(new TodoDto(), entity)
  }
  dtoToEntity(dto) {
    return Object.assign(new Todo(), dto)
  }
}

async function main() {
  const dataSource = await new DataSource({
    type: 'sqljs',
    entities: [TodoSchema],
    synchronize: true,
  }).initialize()

  try {
    const repo = new TodoRepository(dataSource.getRepository(Todo))

    // A row inserted without is_deleted is live (database default false).
    await repo.insert({ id: 'a', title: 'first' })
    await repo.insert({ id: 'b', title: 'second' })
    const live = await repo.read('a')
    assert.equal(live.id, 'a')
    assert.equal(live.title, 'first')

    // Soft delete: read returns null, the row is kept.
    const deleted = await repo.delete('a')
    assert.equal(deleted.id, 'a')
    assert.equal(await repo.read('a'), null)
    const kept = await dataSource.getRepository(Todo).findOneBy({ id: 'a' })
    assert.ok(kept, 'soft-deleted row must stay in the table')
    assert.equal(!!kept.is_deleted, true)

    // pagedSearch excludes the deleted row from count and result.
    const page = await repo.pagedSearch({ pageIndex: 0, pageSize: 10 })
    assert.equal(page.count, 1)
    assert.deepEqual(
      page.result.map((r) => r.id),
      ['b'],
    )
    const all = await repo.pagedSearch({ pageIndex: 0, pageSize: -1 })
    assert.equal(all.count, 1)

    // Sortable field names are matched case-sensitively against entity properties.
    assert.equal(repo.isSortableField('id'), true)
    assert.equal(repo.isSortableField('ID'), false)

    // hardDelete removes the row for real.
    await repo.hardDelete('a')
    assert.equal(await dataSource.getRepository(Todo).findOneBy({ id: 'a' }), null)
  } finally {
    await dataSource.destroy()
  }

  // Nest 11 application context with FrameworkModule (no decorator syntax: apply Module() as a function).
  class AppModule {}
  Module({ imports: [FrameworkModule] })(AppModule)
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
  await app.close()

  console.log('compat OK')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
