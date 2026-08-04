import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        // Mocked Prisma Service to avoid connecting to the database in unit tests
      })
      .compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
    const appModule = module.get<AppModule>(AppModule);
    expect(appModule).toBeDefined();
  });
});
