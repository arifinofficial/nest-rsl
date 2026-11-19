export class FrameworkConstants {
  static readonly SortOrder = {
    Ascending: 'ASC' as const,
    Descending: 'DESC' as const,
  }

  static readonly Messages = {
    FiltersNotAccepted:
      'filters is no longer accepted from the request; set PagedSearchParameter.filters in the service (see CHANGELOG 0.2.0)',
  }
}
