import { Brackets, Repository, FindOptionsWhere } from 'typeorm'
import { Mapper } from '@automapper/core'
import { PagedSearchParameter, PagedSearchResult } from '../models'
import { FrameworkConstants } from '../constants/framework.constants'

export abstract class BaseRepository<
  Entity extends { id: IdType },
  Dto extends { id: IdType },
  IdType = number,
> {
  protected readonly softDeleteColumn?: keyof Entity & string

  constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly mapper: Mapper,
    protected readonly entityType: new () => Entity,
    protected readonly dtoType: new () => Dto,
  ) {}

  async insert(dto: Dto): Promise<Dto> {
    const entity = this.dtoToEntity(dto)
    const savedEntity = await this.repository.save(entity as any)
    return this.entityToDto(savedEntity)
  }

  async read(primaryKey: IdType): Promise<Dto | null> {
    const entity = await this.repository.findOne({
      where: this.liveWhere(primaryKey),
    })
    if (!entity) return null
    return this.entityToDto(entity)
  }

  async update(dto: Dto): Promise<Dto | null> {
    const entity = await this.repository.findOne({
      where: this.liveWhere(dto.id),
    })
    if (!entity) return null
    const updatedEntity = this.dtoToEntity(dto)
    if (this.softDeleteColumn) {
      // update never changes the soft-delete column (use delete / hardDelete), and the live
      // criteria keeps a row soft-deleted since the check above from being written to.
      delete updatedEntity[this.softDeleteColumn]
      await this.repository.update(this.liveWhere(dto.id), updatedEntity as any)
    } else {
      await this.repository.update(dto.id as any, updatedEntity as any)
    }
    const savedEntity = await this.repository.findOne({
      where: this.liveWhere(dto.id),
    })
    if (!savedEntity) return null
    return this.entityToDto(savedEntity)
  }

  async delete(primaryKey: IdType): Promise<Dto | null> {
    if (!this.softDeleteColumn) return this.hardDelete(primaryKey)
    const entity = await this.repository.findOne({
      where: this.liveWhere(primaryKey),
    })
    if (!entity) return null
    const dto = this.entityToDto(entity)
    await this.repository.update(
      this.liveWhere(primaryKey),
      { [this.softDeleteColumn]: true } as any,
    )
    return dto
  }

  async hardDelete(primaryKey: IdType): Promise<Dto | null> {
    const entity = await this.repository.findOne({
      where: { id: primaryKey } as FindOptionsWhere<Entity>,
    })
    if (!entity) return null
    const dto = this.entityToDto(entity)
    await this.repository.delete(primaryKey as any)
    return dto
  }

  async pagedSearch(parameter: PagedSearchParameter): Promise<PagedSearchResult<Dto>> {
    const orderByField = parameter.orderByFieldName || 'id'
    if (!this.isSortableField(orderByField)) {
      throw new Error('Invalid orderByFieldName: ' + orderByField)
    }

    const queryBuilder = this.repository.createQueryBuilder('entity')

    // Each condition gets its own brackets so an OR inside one cannot escape the others:
    // (keyword) AND (filters) AND (soft-delete).
    if (parameter.keyword) {
      const keywordCondition = this.getKeywordSearchCondition(parameter.keyword)
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(keywordCondition, { keyword: `%${parameter.keyword}%` })
        }),
      )
    }

    if (parameter.filters) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where(parameter.filters, parameter.filtersVariable)
        }),
      )
    }

    if (this.softDeleteColumn) {
      queryBuilder.andWhere(`entity.${this.softDeleteColumn} = :__rslSoftDeleteLive`, {
        __rslSoftDeleteLive: false,
      })
    }

    const sortOrder =
      parameter.sortOrder === FrameworkConstants.SortOrder.Descending ? 'DESC' : 'ASC'
    queryBuilder.orderBy(`entity.${orderByField}`, sortOrder)

    const count = await queryBuilder.getCount()

    if (parameter.pageSize !== -1) {
      queryBuilder.skip(parameter.pageIndex * parameter.pageSize).take(parameter.pageSize)
    }

    const entities = await queryBuilder.getMany()
    const result = entities.map((entity: Entity) => this.entityToDto(entity))

    return { count, result }
  }

  isSortableField(name: string): boolean {
    const column = this.repository.metadata.findColumnWithPropertyName(name)
    return !!column && !column.embeddedMetadata
  }

  async bulkInsert(dtos: Dto[]): Promise<Dto[]> {
    const entities = dtos.map((dto) => this.dtoToEntity(dto))
    const savedEntities = await this.repository.save(entities as any)
    return savedEntities.map((entity: Entity) => this.entityToDto(entity))
  }

  private liveWhere(primaryKey: IdType): FindOptionsWhere<Entity> {
    const live = this.softDeleteColumn ? { [this.softDeleteColumn]: false } : {}
    return { id: primaryKey, ...live } as FindOptionsWhere<Entity>
  }

  protected dtoToEntity(dto: Dto): Entity {
    return this.mapper.map(dto, this.dtoType, this.entityType)
  }

  protected entityToDto(entity: Entity): Dto {
    return this.mapper.map(entity, this.entityType, this.dtoType)
  }

  protected getKeywordSearchCondition(_keyword: string): string {
    return '1=1'
  }
}
