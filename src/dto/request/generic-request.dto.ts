export class GenericRequest<T> {
  data!: T

  constructor(init?: Partial<GenericRequest<T>>) {
    if (init && init.data !== undefined) {
      this.data = init.data
    }
  }
}
