import { BasicResponse } from './basic-response.dto'

export class GenericPagedSearchResponse<TDto> extends BasicResponse {
  dtoCollection!: TDto[]
  totalCount!: number
}
