import { BaseDto } from './base.dto'
import { BaseRepository } from './base.repository'
import { GenericRequest, PagedSearchRequest } from '../dto/request'
import { GenericResponse, GenericPagedSearchResponse } from '../dto/response'
import { PagedSearchParameter } from '../models/paged-search-parameter.model'

export abstract class BaseService<
  Entity extends { id: IdType },
  Dto extends BaseDto<IdType>,
  IdType = number,
  Repository extends BaseRepository<Entity, Dto, IdType> = BaseRepository<Entity, Dto, IdType>,
> {
  constructor(protected readonly repository: Repository) {}

  async insert(request: GenericRequest<Dto>): Promise<GenericResponse<Dto>> {
    const response = new GenericResponse<Dto>()
    if (response.isError()) return response
    const result = await this.repository.insert(request.data)
    response.data = result
    response.addInfoMessage('Data saved successfully')
    return response
  }

  async read(request: GenericRequest<IdType>): Promise<GenericResponse<Dto>> {
    const response = new GenericResponse<Dto>()
    const dto = await this.repository.read(request.data)
    if (!dto) {
      response.addErrorMessage('Item not found')
      return response
    }
    response.data = dto
    return response
  }

  async update(request: GenericRequest<Dto>): Promise<GenericResponse<Dto>> {
    const response = new GenericResponse<Dto>()
    if (response.isError()) return response
    const dto = await this.repository.update(request.data)
    if (!dto) {
      response.addErrorMessage('Item not found for update')
      return response
    }
    response.data = dto
    response.addInfoMessage('Data updated successfully')
    return response
  }

  async delete(request: GenericRequest<IdType>): Promise<GenericResponse<Dto>> {
    const response = new GenericResponse<Dto>()
    const dto = await this.repository.delete(request.data)
    if (!dto) {
      response.addErrorMessage('Item not found for deletion')
      return response
    }
    response.data = dto
    response.addInfoMessage('Data deleted successfully')
    return response
  }

  async pagedSearch(request: PagedSearchRequest): Promise<GenericPagedSearchResponse<Dto>> {
    return await this.pagedSearchInternal(this.repository, request)
  }

  async bulkInsert(request: GenericRequest<Dto[]>): Promise<GenericResponse<Dto[]>> {
    const response = new GenericResponse<Dto[]>()
    try {
      if (!request.data || request.data.length === 0) {
        response.addErrorMessage('No data provided')
        return response
      }
      const result = await this.repository.bulkInsert(request.data)
      if (!result || result.length === 0) {
        response.addErrorMessage('Failed to save data')
        return response
      }
      response.data = result
      response.addInfoMessage('Data saved successfully')
    } catch (error: any) {
      response.addErrorMessage(error.message)
    }
    return response
  }

  protected async pagedSearchInternal(
    repository: BaseRepository<Entity, Dto, IdType>,
    request: PagedSearchRequest,
  ): Promise<GenericPagedSearchResponse<Dto>> {
    const response = new GenericPagedSearchResponse<Dto>()
    const pagedSearchParameter = this.getPagedSearchParameter(request)
    const result = await repository.pagedSearch(pagedSearchParameter)
    response.dtoCollection = result.result
    response.totalCount = result.count
    return response
  }

  protected getPagedSearchParameter(request: PagedSearchRequest): PagedSearchParameter {
    return PagedSearchParameter.fromRequest(request)
  }
}
