import { DateTransformInterceptor } from '../src/interceptors'
import { firstValueFrom, of } from 'rxjs'

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

  it('transforms Date objects to timezone-formatted strings', async () => {
    const context = makeContext('UTC') as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler({ createdAt: date }) as any

    const result = await firstValueFrom(interceptor.intercept(context, handler))
    expect(typeof result.createdAt).toBe('string')
  })

  it('transforms dates in arrays', async () => {
    const context = makeContext('UTC') as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler([{ createdAt: date }]) as any

    const result = await firstValueFrom(interceptor.intercept(context, handler))
    expect(typeof result[0].createdAt).toBe('string')
  })

  it('leaves non-date values unchanged', async () => {
    const context = makeContext('UTC') as any
    const handler = makeHandler({ name: 'test', count: 42 }) as any

    const result = await firstValueFrom(interceptor.intercept(context, handler))
    expect(result.name).toBe('test')
    expect(result.count).toBe(42)
  })

  it('falls back to ISO string for invalid timezone', async () => {
    const context = makeContext('Invalid/Timezone') as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler({ createdAt: date }) as any

    const result = await firstValueFrom(interceptor.intercept(context, handler))
    expect(typeof result.createdAt).toBe('string')
  })

  it('uses Time-Zone header if x-timezone is absent', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'time-zone': 'UTC' } }),
      }),
    } as any
    const date = new Date('2024-01-15T10:00:00.000Z')
    const handler = makeHandler({ d: date }) as any

    const result = await firstValueFrom(interceptor.intercept(context, handler))
    expect(typeof result.d).toBe('string')
  })
})
