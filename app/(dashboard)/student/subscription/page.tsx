'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { SUBSCRIPTION_TIER } from '@/lib/utils/constants';

interface Subscription {
  tier: string;
  status: string;
  startDate: string;
  endDate: string | null;
  amount: number;
  currency: string;
}

export default function SubscriptionPage() {
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [message, setMessage] = useState('');

  const isFreeTier = user?.subscriptionTier === SUBSCRIPTION_TIER.FREE_TRIAL;

  useEffect(() => {
    fetch('/api/subscriptions', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(json => setSubscription(json?.data?.subscription ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    setMessage('');
    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok) {
        setMessage('Upgraded successfully! Refreshing…');
        await refreshUser();
        // Reload subscription
        const sub = await fetch('/api/subscriptions', { credentials: 'include' }).then(r => r.json());
        setSubscription(sub?.data?.subscription ?? null);
      } else {
        setMessage(json.error ?? 'Upgrade failed.');
      }
    } catch {
      setMessage('Network error. Please try again.');
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Subscription</h1>
      <p className="text-slate-500 mb-8">Manage your EduPortal access</p>

      {/* Current plan */}
      {loading ? (
        <div className="animate-pulse h-24 bg-slate-100 rounded-xl" />
      ) : (
        <div className={`rounded-xl border-2 p-5 mb-8 ${
          isFreeTier ? 'border-slate-200 bg-slate-50' : 'border-indigo-300 bg-indigo-50'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Current plan</p>
              <p className="text-lg font-bold text-slate-900 mt-0.5">
                {isFreeTier ? 'Free Trial' : 'Level 1'}
              </p>
              {subscription && (
                <p className="text-xs text-slate-400 mt-1">
                  Since {new Date(subscription.startDate).toLocaleDateString()}
                  {subscription.endDate
                    ? ` · Expires ${new Date(subscription.endDate).toLocaleDateString()}`
                    : ''}
                </p>
              )}
            </div>
            {!isFreeTier && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                Active
              </span>
            )}
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {/* Free tier */}
        <div className={`rounded-xl border p-5 ${isFreeTier ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
          <p className="text-sm font-bold text-slate-900 mb-1">Free Trial</p>
          <p className="text-2xl font-bold text-slate-900">₹0</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-500">
            <li>✓ 5 questions per chapter (2E + 2M + 1H)</li>
            <li>✓ KaTeX-rendered questions & solutions</li>
            <li>✓ Progress tracking</li>
            <li>✗ Full question bank (2,000+ questions)</li>
            <li>✗ Adaptive learning engine</li>
          </ul>
        </div>

        {/* Level 1 */}
        <div className={`rounded-xl border-2 p-5 ${!isFreeTier ? 'border-indigo-400 bg-white' : 'border-indigo-200 bg-white'}`}>
          <p className="text-sm font-bold text-indigo-700 mb-1">Level 1</p>
          <p className="text-2xl font-bold text-slate-900">
            ₹999 <span className="text-sm font-normal text-slate-400">/year</span>
          </p>
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            <li>✓ Full question bank (2,000+ questions)</li>
            <li>✓ KaTeX-rendered questions & solutions</li>
            <li>✓ Progress tracking</li>
            <li>✓ Adaptive learning engine</li>
            <li>✓ All chapter access</li>
          </ul>
          {isFreeTier && (
            <button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="mt-4 w-full py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {upgrading ? 'Processing…' : 'Upgrade now (Demo)'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className={`text-sm text-center ${message.includes('success') ? 'text-emerald-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <p className="text-xs text-slate-400 text-center mt-4">
        Payment is stubbed for demo purposes. Clicking &quot;Upgrade now&quot; immediately grants Level 1 access.
      </p>
    </div>
  );
}
