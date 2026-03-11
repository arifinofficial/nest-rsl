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
    filters?: any
    filtersVariable?: any
  }): PagedSearchParameter {
    const parameter = new PagedSearchParameter()
    parameter.pageIndex = request.pageIndex
    parameter.pageSize = request.pageSize
    parameter.orderByFieldName = request.orderByFieldName
    parameter.sortOrder = request.sortOrder
    parameter.keyword = request.keyword
    parameter.filters = request.filters
    parameter.filtersVariable = request.filtersVariable
    return parameter
  }
}
