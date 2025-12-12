import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useHomeData } from './hooks/useHomeData';
import { formatCurrency } from '../../lib/utils';

export function Home() {
    const navigate = useNavigate();
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const {
        monthlySpent,
        monthlySpentChange,
        monthlySpentPercent,
        monthlyIncome,
        monthlyIncomeChange,
        monthlyIncomePercent,
        spentTrendData,
        incomeTrendData,
        wallets,
        loading,
    } = useHomeData(selectedMonth);



    if (loading) {
        return <div className="container">Loading...</div>;
    }

    return (
        <div className="container" style={{ paddingBottom: 'calc(56px + var(--space-2xl))', position: 'relative' }}>
            {/* Animated Background */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(186, 225, 255, 0.05) 0%, rgba(224, 212, 247, 0.05) 50%, rgba(199, 240, 219, 0.05) 100%)',
                zIndex: -1,
                pointerEvents: 'none',
            }} />

            {/* Month Selector */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-lg)',
                padding: 'var(--space-sm) 0',
            }}>
                <button
                    onClick={() => {
                        const newDate = new Date(selectedMonth);
                        newDate.setMonth(newDate.getMonth() - 1);
                        setSelectedMonth(newDate);
                    }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <FiChevronLeft size={20} />
                </button>
                <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                    onClick={() => {
                        const newDate = new Date(selectedMonth);
                        newDate.setMonth(newDate.getMonth() + 1);
                        setSelectedMonth(newDate);
                    }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <FiChevronRight size={20} />
                </button>
            </div>

            {/* Wallet Account Carousel */}
            {wallets.length > 0 && (
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <div style={{
                        display: 'flex',
                        gap: 'var(--space-md)',
                        overflowX: 'auto',
                        paddingBottom: 'var(--space-sm)',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                    }}>
                        {wallets.map((wallet, index) => (
                            <div
                                key={wallet.id}
                                style={{
                                    background: `linear-gradient(135deg, ${getWalletGradient(index)})`,
                                    padding: 'var(--space-xl)',
                                    borderRadius: '16px',
                                    minWidth: '320px',
                                    maxWidth: '320px',
                                    height: '200px',
                                    scrollSnapAlign: 'start',
                                    animation: `cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s backwards`,
                                    color: 'white',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                                onClick={() => navigate('/chart-of-accounts')}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
                                }}
                            >
                                {/* Decorative circles */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-40px',
                                    right: '-40px',
                                    width: '150px',
                                    height: '150px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                }} />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-60px',
                                    left: '-60px',
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '50%',
                                    background: 'rgba(0, 0, 0, 0.1)',
                                }} />

                                {/* Top section */}
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <p style={{
                                        fontSize: '10px',
                                        opacity: 0.8,
                                        marginBottom: '8px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        fontWeight: '500'
                                    }}>
                                        {wallet.name}
                                    </p>
                                    <div style={{
                                        fontSize: '22px',
                                        fontWeight: '600',
                                        letterSpacing: '2px',
                                        fontFamily: 'monospace'
                                    }}>
                                        •••• •••• •••• {String(wallet.balance).slice(-4).padStart(4, '0')}
                                    </div>
                                </div>

                                {/* Bottom section */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-end',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <div>
                                        <div style={{ display: 'flex', gap: 'var(--space-lg)', marginBottom: '8px' }}>
                                            <div>
                                                <p style={{ fontSize: '9px', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    Balance
                                                </p>
                                                <p style={{ fontSize: '13px', fontWeight: '600', marginTop: '2px' }}>
                                                    {formatCurrency(wallet.balance, 'IDR')}
                                                </p>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '9px', opacity: 0.7 }}>
                                            {wallet.percentOfTotal.toFixed(1)}% of total
                                        </p>
                                    </div>

                                    {/* Card logo (Mastercard-style circles) */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '-8px' }}>
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 95, 95, 0.9)',
                                        }} />
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            background: 'rgba(255, 180, 60, 0.9)',
                                            marginLeft: '-12px',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-md)', marginBottom: 'var(--space-2xl)' }}>
                <button
                    onClick={() => navigate('/transactions/income/new')}
                    style={{
                        background: 'white',
                        color: '#2c3e50',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg) var(--space-sm)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = ''}
                    onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                >
                    <img src="/icons/income-3d.png" alt="Income" style={{ width: '32px', height: '32px' }} />
                    Income
                </button>
                <button
                    onClick={() => navigate('/transactions/expense/new')}
                    style={{
                        background: 'white',
                        color: '#2c3e50',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg) var(--space-sm)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s backwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = ''}
                    onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                >
                    <img src="/icons/expense-3d.png" alt="Expense" style={{ width: '32px', height: '32px' }} />
                    Expense
                </button>
                <button
                    onClick={() => navigate('/transactions/transfer/new')}
                    style={{
                        background: 'white',
                        color: '#2c3e50',
                        border: '1px solid rgba(0, 0, 0, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--space-lg) var(--space-sm)',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s backwards',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = ''}
                    onMouseLeave={(e) => e.currentTarget.style.transform = ''}
                >
                    <img src="/icons/balance-3d.png" alt="Transfer" style={{ width: '32px', height: '32px' }} />
                    Transfer
                </button>
            </div>

            {/* Monthly Spent Chart */}
            <div
                className="glass-card"
                style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    marginBottom: 'var(--space-lg)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.4s backwards',
                }}
            >
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Monthly Spent
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>
                        {formatCurrency(monthlySpent, 'IDR')}
                    </h2>
                    <span style={{
                        color: monthlySpentChange >= 0 ? '#FF6B6B' : '#00D09C',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {monthlySpentChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(monthlySpentChange), 'IDR')}
                    </span>
                    <span style={{
                        background: monthlySpentChange >= 0 ? 'rgba(255, 107, 107, 0.1)' : 'rgba(0, 208, 156, 0.1)',
                        color: monthlySpentChange >= 0 ? '#FF6B6B' : '#00D09C',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                    }}>
                        {monthlySpentChange >= 0 ? '+' : ''}{monthlySpentPercent.toFixed(1)}%
                        {monthlySpentChange >= 0 ? '↗' : '↘'}
                    </span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={spentTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FFD54F" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#FFF9C4" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number) => formatCurrency(value, 'IDR')}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#FFD54F"
                            strokeWidth={2}
                            fill="url(#colorSpent)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Monthly Income Chart */}
            <div
                className="glass-card"
                style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(10px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-lg)',
                    marginBottom: 'var(--space-lg)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
                    animation: 'cardEntrance 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.5s backwards',
                }}
            >
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                    Monthly Income
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-md)' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700' }}>
                        {formatCurrency(monthlyIncome, 'IDR')}
                    </h2>
                    <span style={{
                        color: monthlyIncomeChange >= 0 ? '#00D09C' : '#FF6B6B',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        {monthlyIncomeChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(monthlyIncomeChange), 'IDR')}
                    </span>
                    <span style={{
                        background: monthlyIncomeChange >= 0 ? 'rgba(0, 208, 156, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                        color: monthlyIncomeChange >= 0 ? '#00D09C' : '#FF6B6B',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                    }}>
                        {monthlyIncomeChange >= 0 ? '+' : ''}{monthlyIncomePercent.toFixed(1)}%
                        {monthlyIncomeChange >= 0 ? '↗' : '↘'}
                    </span>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={incomeTrendData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#81C784" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#C8E6C9" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(255, 255, 255, 0.95)',
                                border: 'none',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            }}
                            formatter={(value: number) => formatCurrency(value, 'IDR')}
                        />
                        <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#81C784"
                            strokeWidth={2}
                            fill="url(#colorIncome)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

        </div>
    );
}

// Helper function to get gradient colors for wallet cards
function getWalletGradient(index: number): string {
    const gradients = [
        'rgba(102, 126, 234, 0.8), rgba(118, 75, 162, 0.8)',
        'rgba(250, 112, 154, 0.8), rgba(254, 225, 64, 0.8)',
        'rgba(79, 172, 254, 0.8), rgba(0, 242, 254, 0.8)',
        'rgba(67, 233, 123, 0.8), rgba(56, 249, 215, 0.8)',
        'rgba(240, 147, 251, 0.8), rgba(245, 87, 108, 0.8)',
    ];
    return gradients[index % gradients.length];
}
