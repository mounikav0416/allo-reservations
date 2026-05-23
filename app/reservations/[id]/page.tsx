'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';

interface ReservationDetails {
  id: string;
  productName: string;
  sku: string;
  warehouseName: string;
  quantity: number;
  status: string;
  expiresAt: string;
  availableAfterExpiry: number;
}

function getSecondsLeft(expiresAt: string) {
  const delta = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return delta;
}

export default function ReservationPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params?.id as string;
  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!reservationId) return;
    fetchReservation();
    const interval = setInterval(() => {
      refreshCountdown();
    }, 1000);
    return () => clearInterval(interval);
  }, [reservationId]);

  useEffect(() => {
    refreshCountdown();
  }, [reservation]);

  async function fetchReservation() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.get<ReservationDetails>(`/api/reservations/${reservationId}`);
      setReservation(response.data);
      setMessage(null);
    } catch (error: any) {
      setMessage(error.response?.data?.error ?? 'Could not load reservation.');
    } finally {
      setLoading(false);
    }
  }

  function refreshCountdown() {
    if (!reservation) return;
    setSecondsLeft(getSecondsLeft(reservation.expiresAt));
  }

  async function updateReservation(action: 'confirm' | 'release') {
    if (!reservation) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await axios.post<ReservationDetails>(`/api/reservations/${reservation.id}/${action}`);
      setReservation(response.data);
      if (action === 'confirm') {
        setMessage('Purchase confirmed successfully.');
      } else {
        setMessage('Reservation released.');
      }
      if (action === 'confirm') {
        router.refresh();
      }
    } catch (error: any) {
      setMessage(error.response?.data?.error ?? 'Action failed.');
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = useMemo(() => {
    if (!reservation) return 'Loading';
    if (reservation.status === 'PENDING') return 'Pending';
    if (reservation.status === 'CONFIRMED') return 'Confirmed';
    return 'Released';
  }, [reservation]);

  const countdownText = useMemo(() => {
    if (!reservation) return '–';
    if (reservation.status !== 'PENDING') return 'Expired';
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [reservation, secondsLeft]);

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-white shadow-2xl shadow-slate-900/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Reservation checkout</p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Complete your order</h1>
            <p className="mt-4 max-w-2xl text-sm text-slate-300 sm:text-base">
              Finalize your reservation, confirm payment, or cancel if you change your mind. Your item is held until the timer expires.
            </p>
          </div>
          <div className="rounded-[2rem] bg-white/10 p-6 text-slate-100 shadow-xl shadow-slate-950/25 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Order summary</p>
            <p className="mt-3 text-2xl font-semibold">{reservation?.productName ?? 'Loading product...'}</p>
            <p className="mt-2 text-sm text-slate-300">Warehouse: {reservation?.warehouseName ?? '—'}</p>
            <p className="mt-2 text-sm text-slate-300">Qty: {reservation?.quantity ?? '—'}</p>
          </div>
        </div>
      </div>

      {message ? <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">{message}</div> : null}

      <div className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.3)]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-slate-500">Reservation ID</p>
              <p className="mt-2 break-all text-base font-semibold text-slate-900">{reservation?.id ?? 'Loading...'}</p>
            </div>
            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${reservation?.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : reservation?.status === 'PENDING' ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'}`}>
              {statusLabel}
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[1.75rem] bg-slate-50 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Product</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{reservation?.productName ?? '—'}</p>
              <p className="mt-1 text-sm text-slate-500">{reservation?.sku ?? '—'}</p>
            </div>
            <div className="rounded-[1.75rem] bg-slate-50 p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Warehouse</p>
              <p className="mt-3 text-lg font-semibold text-slate-900">{reservation?.warehouseName ?? '—'}</p>
              <p className="mt-1 text-sm text-slate-500">Held stock until expiry</p>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] bg-gradient-to-r from-brand-600 to-cyan-500 p-6 text-white shadow-lg shadow-brand-500/20">
            <p className="text-xs uppercase tracking-[0.25em] text-cyan-100/80">Countdown</p>
            <p className="mt-3 text-4xl font-bold">{countdownText}</p>
            <p className="mt-2 text-sm text-cyan-100/80">Complete your payment before this timer expires.</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_30px_60px_-35px_rgba(15,23,42,0.3)]">
          <h2 className="mb-5 text-xl font-semibold text-slate-900">Quick actions</h2>
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => updateReservation('confirm')}
              disabled={loading || reservation?.status !== 'PENDING'}
              className="w-full rounded-3xl bg-brand-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              Confirm purchase
            </button>
            <button
              type="button"
              onClick={() => updateReservation('release')}
              disabled={loading || reservation?.status !== 'PENDING'}
              className="w-full rounded-3xl border border-slate-300 bg-white px-5 py-4 text-sm font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Cancel reservation
            </button>
          </div>

          <div className="mt-8 space-y-4 rounded-[1.75rem] bg-slate-50 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Available after expiry</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{reservation?.availableAfterExpiry ?? 0} units</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">What happens next?</p>
              <p className="mt-2 text-sm text-slate-600">If the timer runs out, the reservation will be automatically released and stock will return to the warehouse inventory.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
