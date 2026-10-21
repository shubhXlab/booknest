import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeGuestCart } from '../src/routes/cart'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    cart: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    cartItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    book: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Cart Routes - Unit Tests', () => {
  const mockCart = {
    id: 'cart-123',
    userId: 'user-123',
    sessionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockCartItem = {
    id: 'item-123',
    cartId: 'cart-123',
    bookId: 'book-123',
    quantity: 2,
    book: { id: 'book-123', title: 'Clean Code', price: 49.99, stock: 100 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCart', () => {
    it('returns cart with items and totals', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({
        ...mockCart,
        items: [mockCartItem],
      })

      const result = await getCart('user-123')

      expect(result).toEqual({
        id: 'cart-123',
        items: [{ ...mockCartItem, lineTotal: 99.98 }],
        subtotal: 99.98,
        itemCount: 2,
      })
    })

    it('creates cart if not exists for user', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue(null)
      ;(prisma.cart.create as vi.Mock).mockResolvedValue({ ...mockCart, items: [] })

      const result = await getCart('user-123')

      expect(prisma.cart.create).toHaveBeenCalledWith({ data: { userId: 'user-123' } })
      expect(result.items).toEqual([])
    })

    it('uses sessionId for guest cart', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ ...mockCart, userId: null, sessionId: 'session-456', items: [] })

      const result = await getCart(null, 'session-456')

      expect(prisma.cart.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'session-456' },
        include: expect.any(Object),
      })
    })
  })

  describe('addToCart', () => {
    it('adds new item to cart', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue({ id: 'book-123', price: 49.99, stock: 100 })
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ ...mockCart, items: [] })
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue(null)
      ;(prisma.cartItem.create as vi.Mock).mockResolvedValue(mockCartItem)

      const result = await addToCart('user-123', 'book-123', 2)

      expect(result.items).toHaveLength(1)
      expect(prisma.cartItem.create).toHaveBeenCalledWith({
        data: { cartId: 'cart-123', bookId: 'book-123', quantity: 2 },
      })
    })

    it('increments quantity if item exists', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue({ id: 'book-123', price: 49.99, stock: 100 })
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ ...mockCart, items: [mockCartItem] })
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue(mockCartItem)
      ;(prisma.cartItem.update as vi.Mock).mockResolvedValue({ ...mockCartItem, quantity: 4 })

      await addToCart('user-123', 'book-123', 2)

      expect(prisma.cartItem.update).toHaveBeenCalledWith({
        where: { id: 'item-123' },
        data: { quantity: 4 },
      })
    })

    it('throws 400 when exceeding stock', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue({ id: 'book-123', price: 49.99, stock: 1 })
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ ...mockCart, items: [{ ...mockCartItem, quantity: 1 }] })
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue({ ...mockCartItem, quantity: 1 })

      await expect(addToCart('user-123', 'book-123', 5)).rejects.toThrow('Insufficient stock')
    })

    it('throws 404 for non-existent book', async () => {
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue(null)

      await expect(addToCart('user-123', 'bad-id', 1)).rejects.toThrow('Book not found')
    })
  })

  describe('updateCartItem', () => {
    it('updates item quantity', async () => {
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue(mockCartItem)
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue({ stock: 100 })
      ;(prisma.cartItem.update as vi.Mock).mockResolvedValue({ ...mockCartItem, quantity: 5 })

      const result = await updateCartItem('user-123', 'item-123', 5)

      expect(result.quantity).toBe(5)
    })

    it('removes item when quantity is 0', async () => {
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue(mockCartItem)
      ;(prisma.cartItem.delete as vi.Mock).mockResolvedValue(mockCartItem)

      await updateCartItem('user-123', 'item-123', 0)

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-123' } })
    })

    it('validates stock', async () => {
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue(mockCartItem)
      ;(prisma.book.findUnique as vi.Mock).mockResolvedValue({ stock: 3 })

      await expect(updateCartItem('user-123', 'item-123', 10)).rejects.toThrow('Insufficient stock')
    })
  })

  describe('removeFromCart', () => {
    it('removes item from cart', async () => {
      ;(prisma.cartItem.findUnique as vi.Mock).mockResolvedValue(mockCartItem)
      ;(prisma.cartItem.delete as vi.Mock).mockResolvedValue(mockCartItem)

      await removeFromCart('user-123', 'item-123')

      expect(prisma.cartItem.delete).toHaveBeenCalledWith({ where: { id: 'item-123' } })
    })
  })

  describe('clearCart', () => {
    it('removes all items', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ ...mockCart, items: [mockCartItem] })
      ;(prisma.cartItem.deleteMany as vi.Mock).mockResolvedValue({ count: 1 })

      await clearCart('user-123')

      expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({ where: { cartId: 'cart-123' } })
    })
  })

  describe('mergeGuestCart', () => {
    it('merges guest cart into user cart', async () => {
      const guestCart = { id: 'guest-cart', userId: null, sessionId: 'session-456', items: [mockCartItem] }
      ;(prisma.cart.findUnique as vi.Mock)
        .mockResolvedValueOnce(guestCart)
        .mockResolvedValueOnce({ ...mockCart, items: [] })
      ;(prisma.cartItem.findMany as vi.Mock).mockResolvedValue([mockCartItem])
      ;(prisma.cartItem.create as vi.Mock).mockResolvedValue(mockCartItem)
      ;(prisma.cart.delete as vi.Mock).mockResolvedValue(guestCart)

      const result = await mergeGuestCart('user-123', 'session-456')

      expect(prisma.cartItem.create).toHaveBeenCalled()
      expect(prisma.cart.delete).toHaveBeenCalledWith({ where: { id: 'guest-cart' } })
    })
  })
})