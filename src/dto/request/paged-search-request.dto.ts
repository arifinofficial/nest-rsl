import { IsOptional, IsInt, Min, IsString } from 'class-validator'
import { Type } from 'class-transformer'

export class PagedSearchRequest {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  pageIndex!: number

  @IsInt()
  @Min(-1)
  @Type(() => Number)
  pageSize!: number

  @IsOptional()
  @IsString()
  orderByFieldName?: string

  @IsOptional()
  @IsString()
  sortOrder?: string = 'ASC'

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  filters?: string

  @IsOptional()
  filtersVariable?: any
}
