import { AutomapperProfile, InjectMapper } from '@automapper/nestjs'
import {
  Mapper,
  createMap,
  forMember,
  mapFrom,
  MappingConfiguration,
} from '@automapper/core'
import { Injectable } from '@nestjs/common'

@Injectable()
export abstract class BaseMapperProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper)
  }

  abstract override get profile(): (mapper: Mapper) => void

  protected createBaseMappings<TEntity, TDto>(
    mapper: Mapper,
    entityType: new () => TEntity,
    dtoType: new () => TDto,
    ...additionalMappings: MappingConfiguration<TEntity, TDto>[]
  ) {
    return createMap(
      mapper,
      entityType,
      dtoType,
      forMember(
        (dest: TDto) => (dest as any).id,
        mapFrom((src: TEntity) => (src as any).id),
      ),
      forMember(
        (dest: TDto) => (dest as any).createdBy,
        mapFrom((src: TEntity) => (src as any).createdBy),
      ),
      forMember(
        (dest: TDto) => (dest as any).createdDateTime,
        mapFrom((src: TEntity) => (src as any).createdDateTime),
      ),
      forMember(
        (dest: TDto) => (dest as any).lastModifiedBy,
        mapFrom((src: TEntity) => (src as any).lastModifiedBy),
      ),
      forMember(
        (dest: TDto) => (dest as any).lastModifiedDateTime,
        mapFrom((src: TEntity) => (src as any).lastModifiedDateTime),
      ),
      ...additionalMappings,
    )
  }
}
