'use client';

import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  total: number;
  reserved: number;
  available: number;
}

interface ProductWithStock {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  stocks: WarehouseStock[];
}

interface ReservationResponse {
  id: string;
}

const categories = ['Featured', 'Best sellers', 'Top availability', 'Limited edition'];

export default function HomePage() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const productStocks = useMemo(
    () =>
      products.flatMap((product) =>
        product.stocks.map((stock) => ({
          key: `${product.id}-${stock.warehouseId}`,
          product,
          stock,
        }))
      ),
    [products]
  );

  async function fetchProducts() {
    setLoading(true);
    try {
      const response = await axios.get<ProductWithStock[]>('/api/products');
      setProducts(response.data);
      setMessage(null);
    } catch (error) {
      setMessage('Unable to load products.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve(productId: string, warehouseId: string, quantity: number) {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post<ReservationResponse>('/api/reservations', {
        productId,
        warehouseId,
        quantity,
      });
      window.location.href = `/reservations/${response.data.id}`;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        setMessage(error.response.data?.error || 'Reservation failed.');
      } else {
        setMessage('Reservation failed.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] bg-gradient-to-r from-brand-600 via-sky-500 to-cyan-400 p-8 text-white shadow-xl shadow-sky-200/30">
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.35em] text-white/90">
              Allo Commerce
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Reserve inventory across warehouses</h1>
            <p className="mt-4 text-base text-white/90 sm:text-lg">
              Explore product stock, hold inventory during checkout, and complete your purchase before the reservation expires.
            </p>
          </div>

          <div className="rounded-[2rem] bg-white/10 p-6 shadow-2xl shadow-slate-950/10 backdrop-blur-xl sm:w-[360px]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-xl font-bold text-brand-600">A</div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-white/70">Good morning</p>
                <p className="mt-1 text-xl font-semibold text-white">Alex Morgan</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-4 text-center text-sm text-white/90">
                <p className="text-slate-100">Warehouses</p>
                <p className="mt-2 text-2xl font-semibold">2</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-4 text-center text-sm text-white/90">
                <p className="text-slate-100">Products</p>
                <p className="mt-2 text-2xl font-semibold">4</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchProducts}
              disabled={loading}
              className="mt-6 w-full rounded-3xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200"
            >
              Refresh inventory
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {categories.map((category) => (
            <span key={category} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-center text-sm text-white/90 transition hover:bg-white/15">
              {category}
            </span>
          ))}
        </div>
      </section>

      {message ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
          {message}
        </div>
      ) : null}

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-slate-500">Live inventory</p>
            <h2 className="text-3xl font-semibold text-slate-900">Trending products</h2>
          </div>
          <button
            type="button"
            onClick={fetchProducts}
            disabled={loading}
            className="inline-flex items-center rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Refresh stock
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {productStocks.map(({ product, stock }) => (
            <article
              key={`${product.id}-${stock.warehouseId}`}
              className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:shadow-[0_25px_80px_-40px_rgba(15,23,42,0.3)]"
            >
              <div className="bg-gradient-to-br from-sky-500 to-cyan-500 px-6 py-6 text-white">
                <p className="text-xs uppercase tracking-[0.35em] text-cyan-100/90">{stock.warehouseName}</p>
                <h3 className="mt-3 text-2xl font-bold">{product.name}</h3>
                <p className="mt-2 text-sm text-cyan-100/90">{product.sku}</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-500">{product.description}</p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Available</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-900">{stock.available}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reserved</p>
                    <p className="mt-2 text-3xl font-semibold text-brand-600">{stock.reserved}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <select
                    value={selectedQuantities[`${product.id}-${stock.warehouseId}`] ?? 1}
                    onChange={(event) =>
                      setSelectedQuantities((current) => ({
                        ...current,
                        [`${product.id}-${stock.warehouseId}`]: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
                  >
                    {Array.from({ length: Math.max(1, Math.min(stock.available, 5)) }, (_, index) => index + 1).map((quantity) => (
                      <option key={quantity} value={quantity}>{quantity}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={stock.available <= 0 || loading}
                    onClick={() => handleReserve(product.id, stock.warehouseId, selectedQuantities[`${product.id}-${stock.warehouseId}`] ?? 1)}
                    className="w-full rounded-3xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
                  >
                    Reserve now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
