import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder, listOrders, getOrder, cancelOrder, updateOrderStatus } from '../src/routes/orders'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    orderItem: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    cart: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    cartItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    book: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    email: {
      create: vi.fn(),
    },
  },
}))

describe('Orders Routes - Unit Tests', () => {
  const mockOrder = {
    id: 'order-123',
    userId: 'user-123',
    status: 'pending',
    total: 99.98,
    shippingAddress: { street: '123 Main St', city: 'NYC', zip: '10001' },
    paymentIntentId: 'pi_123',
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const mockCartItems = [
    { id: 'item-1', bookId: 'book-1', quantity: 2, book: { price: 49.99, stock: 100 } },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createOrder', () => {
    it('creates order from cart and clears cart', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ id: 'cart-123', userId: 'user-123', items: mockCartItems })
      ;(prisma.cartItem.deleteMany as vi.Mock).mockResolvedValue({ count: 2 })
      ;(prisma.order.create as vi.Mock).mockResolvedValue(mockOrder)
      ;(prisma.orderItem.create as vi.Mock).mockResolvedValue({})
      ;(prisma.email.create as vi.Mock).mockResolvedValue({})

      const result = await createOrder('user-123', {
        shippingAddress: { street: '123 Main St', city: 'NYC', zip: '10001' },
        paymentIntentId: 'pi_123',
      })

      expect(result).toEqual(mockOrder)
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-123', total: 99.98 }),
        })
      )
    })

    it('throws 400 for empty cart', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ id: 'cart-123', userId: 'user-123', items: [] })

      await expect(createOrder('user-123', { shippingAddress: {}, paymentIntentId: 'pi_123' }))
        .rejects.toThrow('Cart is empty')
    })

    it('validates shipping address', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ id: 'cart-123', userId: 'user-123', items: mockCartItems })

      await expect(createOrder('user-123', { shippingAddress: { street: '', city: '', zip: '' } }))
        .rejects.toThrow('Shipping address is required')
    })

    it('decrements book stock', async () => {
      ;(prisma.cart.findUnique as vi.Mock).mockResolvedValue({ id: 'cart-123', userId: 'user-123', items: mockCartItems })
      ;(prisma.cartItem.deleteMany as vi.Mock).mockResolvedValue({ count: 1 })
      ;(prisma.order.create as vi.Mock).mockResolvedValue(mockOrder)
      ;(prisma.orderItem.create as vi.Mock).mockResolvedValue({})
      ;(prisma.book.findMany as vi.Mock).mockResolvedValue([{ id: 'book-1', stock: 100 }])
      ;(prisma.book.update as vi.Mock).mockResolvedValue({ id: 'book-1', stock: 98 })
      ;(prisma.email.create as vi.Mock).mockResolvedValue({})

      await createOrder('user-123', { shippingAddress: { street: '123', city: 'NYC', zip: '10001' }, paymentIntentId: 'pi_123' })

      expect(prisma.book.update).toHaveBeenCalledWith({ where: { id: 'book-1' }, data: { stock: 98 } })
    })
  })

  describe('listOrders', () => {
    it('returns paginated orders for user', async () => {
      ;(prisma.order.findMany as vi.Mock).mockResolvedValue([mockOrder])
      ;(prisma.order.count as vi.Mock).mockResolvedValue(1)

      const result = await listOrders('user-123', { page: 1, limit: 10 })

      expect(result).toEqual({
        data: [mockOrder],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      })
    })

    it('supports status filter', async () => {
      ;(prisma.order.findMany as vi.Mock).mockResolvedValue([mockOrder])
      ;(prisma.order.count as vi.Mock).mockResolvedValue(1)

      await listOrders('user-123', { page: 1, limit: 10, status: 'delivered' })

      expect(prisma.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-123', status: 'delivered' } })
      )
    })
  })

  describe('getOrder', () => {
    it('returns order with items', async () => {
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue({ ...mockOrder, items: mockCartItems })

      const result = await getOrder('order-123', 'user-123')

      expect(result).toMatchObject({ id: 'order-123', userId: 'user-123' })
    })

    it('throws 404 for non-existent order', async () => {
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue(null)

      await expect(getOrder('bad-id', 'user-123')).rejects.toThrow('Order not found')
    })

    it('throws 403 when user does not own order', async () => {
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue({ ...mockOrder, userId: 'other-user' })

      await expect(getOrder('order-123', 'user-123')).rejects.toThrow('Forbidden')
    })
  })

  describe('cancelOrder', () => {
    it('cancels pending order and restores stock', async () => {
      const orderWithItems = { ...mockOrder, status: 'pending', items: mockCartItems }
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue(orderWithItems)
      ;(prisma.order.update as vi.Mock).mockResolvedValue({ ...mockOrder, status: 'cancelled' })
      ;(prisma.book.update as vi.Mock).mockResolvedValue({ id: 'book-1', stock: 102 })

      const result = await cancelOrder('order-123', 'user-123')

      expect(result.status).toBe('cancelled')
      expect(prisma.book.update).toHaveBeenCalledWith({
        where: { id: 'book-1' },
        data: { stock: 102 },
      })
    })

    it('cannot cancel delivered order', async () => {
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue({ ...mockOrder, status: 'delivered' })

      await expect(cancelOrder('order-123', 'user-123')).rejects.toThrow('Cannot cancel a delivered order')
    })
  })

  describe('updateOrderStatus (admin)', () => {
    it('updates order status', async () => {
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue(mockOrder)
      ;(prisma.order.update as vi.Mock).mockResolvedValue({ ...mockOrder, status: 'shipped' })

      const result = await updateOrderStatus('order-123', 'shipped')

      expect(result.status).toBe('shipped')
    })

    it('validates status transition', async () => {
      ;(prisma.order.findUnique as vi.Mock).mockResolvedValue({ ...mockOrder, status: 'cancelled' })

      await expect(updateOrderStatus('order-123', 'shipped')).rejects.toThrow('Invalid status transition')
    })
  })
})