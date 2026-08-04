import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockJwtService: Record<string, jest.Mock>;

  beforeEach(() => {
    mockJwtService = {
      verifyAsync: jest.fn(),
    };
    guard = new JwtAuthGuard(mockJwtService as any as JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if header is missing', async () => {
    const mockRequest = { headers: {} };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if auth format is not Bearer', async () => {
    const mockRequest = { headers: { authorization: 'Basic 123' } };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException if token verification fails', async () => {
    const mockRequest = { headers: { authorization: 'Bearer bad-token' } };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any as ExecutionContext;

    mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid signature'));

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should verify token, attach request.user, and return true if verified', async () => {
    const mockRequest = { headers: { authorization: 'Bearer good-token' }, user: null };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as any as ExecutionContext;

    mockJwtService.verifyAsync.mockResolvedValue({ sub: '42', email: 'john@example.com' });

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('good-token', { secret: 'super-secret' });
    expect(mockRequest.user).toEqual({ id: 42, email: 'john@example.com' });
  });
});
