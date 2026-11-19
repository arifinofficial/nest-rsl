import 'reflect-metadata'
import { Column, DataSource, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm'
import { AutoMap, classes } from '@automapper/classes'
import { createMap, createMapper, Mapper } from '@automapper/core'
import { BaseRepository } from '../../src/base/base.repository'
import { BaseService } from '../../src/base/base.service'

@Entity('todo')
export class TodoEntity {
  @AutoMap()
  @PrimaryColumn({ type: 'varchar' })
  id!: string

  @AutoMap()
  @Column({ type: 'varchar' })
  title!: string

  @AutoMap()
  @Column({ type: 'boolean', default: false })
  is_deleted!: boolean

  @AutoMap()
  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date
}

export class TodoDto {
  @AutoMap()
  id!: string

  @AutoMap()
  title!: string

  @AutoMap()
  is_deleted!: boolean

  @AutoMap()
  updated_at!: Date
}

export class TodoRepository extends BaseRepository<TodoEntity, TodoDto, string> {}

export class SoftTodoRepository extends BaseRepository<TodoEntity, TodoDto, string> {
  protected readonly softDeleteColumn = 'is_deleted' as const
}

export class TodoService extends BaseService<TodoEntity, TodoDto, string, TodoRepository> {}

export class SoftTodoService extends BaseService<TodoEntity, TodoDto, string, SoftTodoRepository> {}

export async function createHarness() {
  const dataSource = new DataSource({
    type: 'sqljs',
    entities: [TodoEntity],
    synchronize: true,
  })
  await dataSource.initialize()

  const mapper: Mapper = createMapper({ strategyInitializer: classes() })
  createMap(mapper, TodoEntity, TodoDto)
  createMap(mapper, TodoDto, TodoEntity)

  const typeormRepo = dataSource.getRepository(TodoEntity)
  const todoRepo = new TodoRepository(typeormRepo, mapper, TodoEntity, TodoDto)
  const softRepo = new SoftTodoRepository(typeormRepo, mapper, TodoEntity, TodoDto)
  const todoService = new TodoService(todoRepo)
  const softService = new SoftTodoService(softRepo)

  return { dataSource, todoRepo, softRepo, todoService, softService }
}
