import { BasicResponse } from './basic-response.dto'

export class GenericResponse<T> extends BasicResponse {
  data!: T
}
