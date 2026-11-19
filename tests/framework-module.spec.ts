import 'reflect-metadata'
import { Injectable } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { InjectMapper } from '@automapper/nestjs'
import type { Mapper } from '@automapper/core'
import { FrameworkModule } from '../src/framework.module'

@Injectable()
class Dependency {}

@Injectable()
class SomeService {
  constructor(
    @InjectMapper() readonly mapper: Mapper,
    readonly dependency: Dependency,
  ) {}
}

describe('FrameworkModule', () => {
  it('compiles a Nest 12 module with FrameworkModule and injects a mapper-backed service', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FrameworkModule],
      providers: [Dependency, SomeService],
    }).compile()

    const service = moduleRef.get(SomeService)
    expect(service.mapper).toBeDefined()
    // Injected by type only: proves design:paramtypes metadata is emitted.
    expect(service.dependency).toBeInstanceOf(Dependency)
  })
})
