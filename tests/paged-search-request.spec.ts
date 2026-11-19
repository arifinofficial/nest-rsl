import 'reflect-metadata'
import { BadRequestException, ValidationPipe } from '@nestjs/common'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import { PagedSearchRequest } from '../src/dto/request'

const FILTERS_NOT_ACCEPTED =
  'filters is no longer accepted from the request; set PagedSearchParameter.filters in the service (see CHANGELOG 0.2.0)'

const build = (extra: Record<string, unknown> = {}) =>
  plainToInstance(PagedSearchRequest, { pageIndex: 0, pageSize: 10, ...extra })

describe('PagedSearchRequest validation', () => {
  it('fails validation with FiltersNotAccepted when filters is present', async () => {
    const errors = await validate(build({ filters: '1=1' }))

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('filters')
    expect(Object.values(errors[0].constraints ?? {})).toContain(FILTERS_NOT_ACCEPTED)
  })

  it('fails validation when filtersVariable is present', async () => {
    const errors = await validate(build({ filtersVariable: { a: 1 } }))

    expect(errors).toHaveLength(1)
    expect(errors[0].property).toBe('filtersVariable')
    expect(Object.values(errors[0].constraints ?? {})).toContain(FILTERS_NOT_ACCEPTED)
  })

  it('still rejects filters and filtersVariable when validation groups are set', async () => {
    const errors = await validate(build({ filters: '1=1', filtersVariable: { a: 1 } }), {
      groups: ['other'],
    })

    expect(errors.map((e) => e.property).sort()).toEqual(['filters', 'filtersVariable'])
  })

  it('passes when neither is present', async () => {
    expect(await validate(build())).toHaveLength(0)
  })

  it('keeps filters under whitelist: true so the pipe answers 400 instead of stripping', async () => {
    const pipe = new ValidationPipe({ whitelist: true })

    await expect(
      pipe.transform(
        { pageIndex: 0, pageSize: 10, filters: '1=1' },
        { type: 'body', metatype: PagedSearchRequest },
      ),
    ).rejects.toBeInstanceOf(BadRequestException)
  })
})
