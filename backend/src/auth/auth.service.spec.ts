import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let mockJwtService: Record<string, jest.Mock>;
  let mockPrismaService: {
    user: { findUnique: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockJwtService = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await expect(service.register('test@example.com', 'password123')).rejects.toThrow(
        ConflictException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password, create user, and return JWT token', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password-123');

      const mockCreatedUser = {
        id: 42,
        email: 'test@example.com',
        password: 'hashed-password-123',
        name: 'John Doe',
        isAdmin: false,
      };
      mockPrismaService.user.create.mockResolvedValue(mockCreatedUser);

      const result = await service.register('test@example.com', 'password123', 'John Doe');

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed-password-123',
          name: 'John Doe',
        },
      });
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 42, email: 'test@example.com' });
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: {
          id: 42,
          email: 'test@example.com',
          name: 'John Doe',
          isAdmin: false,
        },
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user is not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login('test@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password check fails', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 1, email: 'test@example.com', password: 'hashed' });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // wrong password

      await expect(service.login('test@example.com', 'pass')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hashed');
    });

    it('should return user and token if verification succeeds', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        password: 'hashed',
        name: 'John',
        isAdmin: true,
      };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true); // correct password

      const result = await service.login('test@example.com', 'pass');

      expect(bcrypt.compare).toHaveBeenCalledWith('pass', 'hashed');
      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: 1, email: 'test@example.com' });
      expect(result).toEqual({
        token: 'mock-jwt-token',
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'John',
          isAdmin: true,
        },
      });
    });
  });
});
