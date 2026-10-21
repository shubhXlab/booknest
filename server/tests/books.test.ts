import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listBooks, getBook, createBook, updateBook, deleteBook, searchBooks } from '../src/routes/books'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    book: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}))

describe('Books Routes - Unit Tests', () => {
  const mockBook = {
    id: 'book-123',
    title: 'Clean Code',
    author: 'Robert Martin',
    isbn: '9780132350884',
    price: 49.99,
    stock: 100,
    category: 'Programming',
    description: 'A handbook of agile software craftsmanship',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listBooks', () => {
    it('returns paginated books with default params', async () => {
      ;(prisma.book.findMany as vi.Mock).mockResolvedValue([mockBook])
      ;(prisma.book.count as vi.Mock).mockResolvedValue(1)

      const result = await listBooks({ page: 1, limit: 20 })

      expect(result).toEqual({
        data: [mockBook],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })
    })

    it('applies category filter', async () => {
      ;(prisma.book.findMany as vi.Mock).mockResolvedValue([mockBook])
      ;(prisma.book.count as vi.Mock).mockResolvedValue(1)

      await listBooks({ page: 1, limit: 20, category: 'Programming' })

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { category: 'Programming' } })
      )
    })

    it('applies price range filter', async () => {
      ;(prisma.book.findMany as vi.Mock).mockResolvedValue([mockBook])
      ;(prisma.book.count as vi.Mock).mockResolvedValue(1)

      await listBooks({ minPrice: 10, maxPrice: 100 })

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { price: { gte: 10, lte: 100 } },
        })
      )
    })

    it('sorts by price ascending', async () => {
      ;(prisma.book.findMany as vi.Mock).mockResolvedValue([mockBook])
      ;(prisma.book.count as vi.Mock).mockResolvedValue(1)

      await listBooks({ sortBy: 'price', sortOrder: 'asc' })

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { price: 'asc' } })
      )
    })
  })

  describe('getBook', () => {
    it('returns book by ID', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue(mockBook)

      const result = await getBook('book-123')

      expect(result).toEqual(mockBook)
    })

    it('throws 404 for non-existent book', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue(null)

      await expect(getBook('bad-id')).rejects.toThrow('Book not found')
    })
  })

  describe('createBook (admin)', () => {
    it('creates a new book', async () => {
      ;(prisma.book.create as vi.Mock).mockResolvedValue(mockBook)

      const result = await createBook({
        title: 'Clean Code',
        author: 'Robert Martin',
        isbn: '9780132350884',
        price: 49.99,
        stock: 100,
        category: 'Programming',
        description: 'A handbook...',
      })

      expect(result).toEqual(mockBook)
      expect(prisma.book.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ title: 'Clean Code', isbn: '9780132350884' }),
        })
      )
    })

    it('validates unique ISBN', async () => {
      const error = new Error('Unique constraint failed')
      ;(error as any).code = 'P2002'
      ;(prisma.book.create as vi.Mock).mockRejectedValue(error)

      await expect(createBook({ ...mockBook, title: 'Other' })).rejects.toThrow('ISBN already exists')
    })

    it('validates required fields', async () => {
      await expect(createBook({ title: '', author: '', isbn: '', price: -1, stock: -1 }))
        .rejects.toThrow()
    })
  })

  describe('updateBook (admin)', () => {
    it('updates book fields', async () => {
      const updated = { ...mockBook, price: 39.99, stock: 50 }
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue(mockBook)
      ;(prisma.book.update as vi.Mock).mockResolvedValue(updated)

      const result = await updateBook('book-123', { price: 39.99, stock: 50 })

      expect(result.price).toBe(39.99)
      expect(result.stock).toBe(50)
    })

    it('throws 404 for non-existent book', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue(null)

      await expect(updateBook('bad-id', { price: 10 })).rejects.toThrow('Book not found')
    })
  })

  describe('deleteBook (admin)', () => {
    it('deletes a book', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue(mockBook)
      ;(prisma.book.delete as vi.Mock).mockResolvedValue(mockBook)

      await deleteBook('book-123')

      expect(prisma.book.delete).toHaveBeenCalledWith({ where: { id: 'book-123' } })
    })
  })

  describe('searchBooks', () => {
    it('searches by title and author', async () => {
      ;(prisma.book.findMany as vi.Mock).mockResolvedValue([mockBook])

      await searchBooks('clean code')

      expect(prisma.book.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { title: { contains: 'clean code', mode: 'insensitive' } },
              { author: { contains: 'clean code', mode: 'insensitive' } },
            ],
          },
        })
      )
    })
  })
})