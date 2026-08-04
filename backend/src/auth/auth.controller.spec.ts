import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockAuthService = {
      register: jest.fn().mockResolvedValue({ token: 'reg-token', user: {} }),
      login: jest.fn().mockResolvedValue({ token: 'login-token', user: {} }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should delegate register call to AuthService', async () => {
      const body = { email: 'john@example.com', password: '123', name: 'John' };
      const res = await controller.register(body);

      expect(mockAuthService.register).toHaveBeenCalledWith('john@example.com', '123', 'John');
      expect(res).toEqual({ token: 'reg-token', user: {} });
    });
  });

  describe('login', () => {
    it('should delegate login call to AuthService', async () => {
      const body = { email: 'john@example.com', password: '123' };
      const res = await controller.login(body);

      expect(mockAuthService.login).toHaveBeenCalledWith('john@example.com', '123');
      expect(res).toEqual({ token: 'login-token', user: {} });
    });
  });
});
