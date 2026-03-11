import { Module, Global } from '@nestjs/common'
import { AutomapperModule } from '@automapper/nestjs'
import { classes } from '@automapper/classes'

@Global()
@Module({
  imports: [
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
  ],
  exports: [AutomapperModule],
})
export class FrameworkModule {}
