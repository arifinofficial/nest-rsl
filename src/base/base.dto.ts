import { AutoMap } from '@automapper/classes'

export abstract class BaseDto<T = number> {
  @AutoMap()
  id!: T

  @AutoMap()
  createdBy!: string

  @AutoMap()
  createdDateTime!: Date

  @AutoMap()
  lastModifiedBy!: string

  @AutoMap()
  lastModifiedDateTime!: Date
}
