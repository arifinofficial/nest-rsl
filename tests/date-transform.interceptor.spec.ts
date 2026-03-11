import { DateTransformInterceptor } from '../src/interceptors'
import { of } from 'rxjs'

describe('DateTransformInterceptor', () => {
  let interceptor: DateTransformInterceptor

  beforeEach(() => {
    interceptor = new DateTransformInterceptor()
  })

  const makeContext = (timezone: string) => ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { 'x-timezone': timezone } }),
    }),
  })

  const makeHandler = (data: any) => ({
    handle: () => of(data),
  })

  it('transforms Date objects to timezone-formatted strings', (done) => {
    const context = makeContext('UTC') as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler({ createdAt: date }) as any

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(typeof result.createdAt).toBe('string')
      done()
    })
  })

  it('transforms dates in arrays', (done) => {
    const context = makeContext('UTC') as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler([{ createdAt: date }]) as any

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(typeof result[0].createdAt).toBe('string')
      done()
    })
  })

  it('leaves non-date values unchanged', (done) => {
    const context = makeContext('UTC') as any
    const handler = makeHandler({ name: 'test', count: 42 }) as any

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result.name).toBe('test')
      expect(result.count).toBe(42)
      done()
    })
  })

  it('falls back to ISO string for invalid timezone', (done) => {
    const context = makeContext('Invalid/Timezone') as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler({ createdAt: date }) as any

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(typeof result.createdAt).toBe('string')
      done()
    })
  })

  it('uses Time-Zone header if x-timezone is absent', (done) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'time-zone': 'UTC' } }),
      }),
    } as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler({ d: date }) as any

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(typeof result.d).toBe('string')
      done()
    })
  })
})
