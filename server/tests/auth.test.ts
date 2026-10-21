import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { register, login, logout, refreshToken, resetPassword } from '../src/routes/auth'
import { prisma } from '../src/lib/prisma'
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../src/lib/auth'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../src/lib/auth', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
  generateToken: vi.fn(),
  verifyToken: vi.fn(),
}))

describe('Auth Routes - Unit Tests', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    createdAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('creates a new user and returns tokens', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)
      ;(hashPassword as vi.Mock).mockResolvedValue('hashed-password')
      ;(prisma.user.create as vi.Mock).mockResolvedValue(mockUser)
      ;(generateToken as vi.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      const result = await register({ email: 'test@example.com', password: 'Password123', name: 'Test User' })

      expect(result).toEqual({
        user: { id: mockUser.id, email: mockUser.email, name: mockUser.name },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      })
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: { email: 'test@example.com', passwordHash: 'hashed-password', name: 'Test User' },
      })
    })

    it('throws 409 when email already exists', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser)

      await expect(register({ email: 'test@example.com', password: 'Password123', name: 'Test' }))
        .rejects.toThrow('Email already registered')
    })

    it('validates password strength', async () => {
      await expect(register({ email: 'new@example.com', password: 'weak', name: 'Test' }))
        .rejects.toThrow('Password must be at least 8 characters')
    })
  })

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser)
      ;(verifyPassword as vi.Mock).mockResolvedValue(true)
      ;(generateToken as vi.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token')

      const result = await login({ email: 'test@example.com', password: 'Password123' })

      expect(result.accessToken).toBe('access-token')
      expect(result.refreshToken).toBe('refresh-token')
    })

    it('throws 401 for invalid password', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser)
      ;(verifyPassword as vi.Mock).mockResolvedValue(false)

      await expect(login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials')
    })

    it('throws 401 for non-existent user', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(null)

      await expect(login({ email: 'none@example.com', password: 'Password123' }))
        .rejects.toThrow('Invalid credentials')
    })
  })

  describe('logout', () => {
    it('invalidates refresh token', async () => {
      ;(prisma.user.update as vi.Mock).mockResolvedValue({ ...mockUser, refreshToken: null })

      await logout('user-123')

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { refreshToken: null },
      })
    })
  })

  describe('refreshToken', () => {
    it('returns new access token for valid refresh token', async () => {
      ;(verifyToken as vi.Mock).mockReturnValue({ userId: 'user-123', type: 'refresh' })
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue({ ...mockUser, refreshToken: 'valid-refresh' })
      ;(generateToken as vi.Mock).mockReturnValue('new-access-token')

      const result = await refreshToken('valid-refresh')

      expect(result.accessToken).toBe('new-access-token')
    })

    it('throws 401 for invalid/expired refresh token', async () => {
      ;(verifyToken as vi.Mock).mockImplementation(() => { throw new Error('Invalid token') })

      await expect(refreshToken('bad-token')).rejects.toThrow('Invalid refresh token')
    })
  })

  describe('resetPassword', () => {
    it('updates password and invalidates sessions', async () => {
      ;(prisma.user.findUnique as vi.Mock).mockResolvedValue(mockUser)
      ;(hashPassword as vi.Mock).mockResolvedValue('new-hash')
      ;(prisma.user.update as vi.Mock).mockResolvedValue({ ...mockUser, passwordHash: 'new-hash', refreshToken: null })

      await resetPassword('test@example.com', 'NewPassword123')

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { passwordHash: 'new-hash', refreshToken: null } })
      )
    })
  })
})