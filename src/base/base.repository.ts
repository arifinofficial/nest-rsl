import { Repository, FindOptionsWhere } from 'typeorm'
import { Mapper } from '@automapper/core'
import { BaseDto } from './base.dto'
import { PagedSearchParameter, PagedSearchResult } from '../models'
import { FrameworkConstants } from '../constants/framework.constants'

export abstract class BaseRepository<
  Entity extends { id: IdType },
  Dto extends BaseDto<IdType>,
  IdType = number,
> {
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
      where: { id: primaryKey } as FindOptionsWhere<Entity>,
    })
    if (!entity) return null
    return this.entityToDto(entity)
  }

  async update(dto: Dto): Promise<Dto | null> {
    const entity = await this.repository.findOne({
      where: { id: dto.id } as FindOptionsWhere<Entity>,
    })
    if (!entity) return null
    const updatedEntity = this.dtoToEntity(dto)
    await this.repository.update(dto.id as any, updatedEntity as any)
    const savedEntity = await this.repository.findOne({
      where: { id: dto.id } as FindOptionsWhere<Entity>,
    })
    if (!savedEntity) return null
    return this.entityToDto(savedEntity)
  }

  async delete(primaryKey: IdType): Promise<Dto | null> {
    const entity = await this.repository.findOne({
      where: { id: primaryKey } as FindOptionsWhere<Entity>,
    })
    if (!entity) return null
    const dto = this.entityToDto(entity)
    await this.repository.delete(primaryKey as any)
    return dto
  }

  async pagedSearch(parameter: PagedSearchParameter): Promise<PagedSearchResult<Dto>> {
    const queryBuilder = this.repository.createQueryBuilder('entity')

    if (parameter.keyword) {
      queryBuilder.where(this.getKeywordSearchCondition(parameter.keyword), {
        keyword: `%${parameter.keyword}%`,
      })
    }

    if (parameter.filters) {
      queryBuilder.andWhere(parameter.filters, parameter.filtersVariable)
    }

    const orderByField = parameter.orderByFieldName || 'id'
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

  async bulkInsert(dtos: Dto[]): Promise<Dto[]> {
    const entities = dtos.map((dto) => this.dtoToEntity(dto))
    const savedEntities = await this.repository.save(entities as any)
    return savedEntities.map((entity: Entity) => this.entityToDto(entity))
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
