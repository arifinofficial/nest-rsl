import { IsEmpty, IsOptional, IsInt, Min, IsString } from 'class-validator'
import { Type } from 'class-transformer'
import { FrameworkConstants } from '../../constants/framework.constants'

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

  /**
   * No longer accepted from the client. Typed `never` so TypeScript callers get a compile
   * error; the validator rejects any value so a ValidationPipe answers 400 instead of
   * silently stripping it (see CHANGELOG 0.2.0).
   */
  @IsEmpty({ message: FrameworkConstants.Messages.FiltersNotAccepted, always: true })
  filters?: never

  /** See `filters`. */
  @IsEmpty({ message: FrameworkConstants.Messages.FiltersNotAccepted, always: true })
  filtersVariable?: never
}
