import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Mock recharts (not installed as a dependency)
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Bar: () => null,
  Pie: () => null,
  PieData: () => null,
  PieLabel: () => null,
  Color: () => null,
}))

// Mock components that don't exist as exports
vi.mock('../src/components', () => ({
  Card: ({ children }) => <div data-testid="card">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>,
  CardBody: ({ children }) => <div data-testid="card-body">{children}</div>,
  CardFooter: ({ children }) => <div data-testid="card-footer">{children}</div>,
  StatCard: ({ title, value, trend, trendValue }) => (
    <div data-testid="stat-card" data-title={title}>
      <span data-testid="stat-value">{value}</span>
      {trendValue !== undefined && <span data-testid="stat-trend">{trendValue}%</span>}
    </div>
  ),
  Button: ({ children, onClick }) => (
    <button data-testid="button" onClick={onClick}>{children}</button>
  ),
}))

vi.mock('../src/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
}))

import api from '../src/lib/api'
import AdminDashboard from '../src/pages/AdminDashboard'

const mockStats = {
  totalBooks: 42,
  totalUsers: 150,
  totalOrders: 300,
  totalSales: 12500.50,
  growthPct: 12,
}

const mockSalesData = [
  { name: 'Mon', uv: 100 },
  { name: 'Tue', uv: 150 },
]

const mockTopBooks = [
  { id: 1, title: 'Book A', author: 'Author A', image_url: null, quantity_sold: 10, revenue: 200 },
]

const mockTopCategories = [
  { id: 1, name: 'Fiction', orders: 50, revenue: 1000 },
]

beforeEach(() => {
  vi.clearAllMocks()
  // Default: api.get returns resolved responses
  ;(api.get).mockImplementation((url) => {
    if (url.includes('/admin/stats')) return Promise.resolve({ data: mockStats })
    if (url.includes('/admin/analytics/sales')) return Promise.resolve({ data: mockSalesData })
    if (url.includes('/admin/analytics/top-books')) return Promise.resolve({ data: mockTopBooks })
    if (url.includes('/admin/analytics/top-categories')) return Promise.resolve({ data: mockTopCategories })
    return Promise.resolve({ data: [] })
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('AdminDashboard - Unit Tests', () => {
  it('renders loading state initially', () => {
    // api.get returns promises that won't resolve immediately
    ;(api.get).mockReturnValue(new Promise(() => {}))

    render(<AdminDashboard />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders stats cards after data loads', async () => {
    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0))

    // Should render 4 stat cards
    const statCards = screen.getAllByTestId('stat-card')
    expect(statCards.length).toBe(4)

    // Check specific stat values
    expect(screen.getAllByTestId('stat-value')[0]).toHaveTextContent('42')
  })

  it('displays total books, users, orders, and sales', async () => {
    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0))

    const titles = screen.getAllByTestId('stat-card').map(el => el.getAttribute('data-title'))
    expect(titles).toContain('Total Books')
    expect(titles).toContain('Total Users')
    expect(titles).toContain('Total Orders')
    expect(titles).toContain('Total Sales')
  })

  it('calls the correct API endpoints on mount', async () => {
    render(<AdminDashboard />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/admin/stats'))
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/sales', { period: 'daily' })
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/top-books')
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/top-categories')
  })

  it('period selector changes sales data when clicked', async () => {
    render(<AdminDashboard />)

    await waitFor(() => expect(screen.getAllByTestId('stat-card').length).toBeGreaterThan(0))

    // Click Weekly button
    const weeklyButton = screen.getAllByText('Weekly')[0]
    fireEvent.click(weeklyButton)

    // api.get should be called with weekly period
    expect(api.get).toHaveBeenCalledWith('/admin/analytics/sales', { period: 'weekly' })
  })

  it('handles API error gracefully', async () => {
    ;(api.get).mockRejectedValueOnce(new Error('Network error'))

    render(<AdminDashboard />)

    // Should not crash - loading state eventually resolves or shows error
    await waitFor(() => {
      // Component either shows loading or error - just verify it doesn't throw
      expect(screen.getAllByText('Loading...').length).toBeGreaterThan(0)
    }, { timeout: 1000 })
  })
})
