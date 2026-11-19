import { isEmpty } from 'class-validator'
import { FrameworkConstants } from '../constants/framework.constants'

export class PagedSearchParameter {
  pageIndex!: number
  pageSize!: number
  orderByFieldName?: string
  sortOrder?: string
  keyword?: string
  filters?: any
  filtersVariable?: any

  static fromRequest(request: {
    pageIndex: number
    pageSize: number
    orderByFieldName?: string
    sortOrder?: string
    keyword?: string
    filters?: unknown
    filtersVariable?: unknown
  }): PagedSearchParameter {
    if (!isEmpty(request.filters) || !isEmpty(request.filtersVariable)) {
      throw new Error(FrameworkConstants.Messages.FiltersNotAccepted)
    }
    const parameter = new PagedSearchParameter()
    parameter.pageIndex = request.pageIndex
    parameter.pageSize = request.pageSize
    parameter.orderByFieldName = request.orderByFieldName
    parameter.sortOrder = request.sortOrder
    parameter.keyword = request.keyword
    return parameter
  }
}
