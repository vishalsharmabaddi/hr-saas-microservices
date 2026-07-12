import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Receipt, FileDown, Inbox } from 'lucide-react'
import api from '../api/axios'
import { downloadPayslipPDF, loadImageAsset } from '../utils/exportReport'
import logoUrl from '../assets/Taurus-Logo.png'

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function MyPayslipsPage() {
  // Logo for PDF letterhead (loads once, ready by the time user clicks download)
  const [brand, setBrand] = useState(null)
  useEffect(() => { loadImageAsset(logoUrl).then(setBrand).catch(() => setBrand(null)) }, [])

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['my-payslips'],
    queryFn: () => api.get('/payroll/me/payslips').then(r => Array.isArray(r.data) ? r.data : []),
  })

  // Employee ka naam — payslip se (accurate), warna login user se
  const user = JSON.parse(localStorage.getItem('wt_user') || '{}')
  const employeeName = payslips[0]?.employeeName || user.name || ''

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Receipt size={26} color="#16A34A" /> My Payslips
        </h1>
        {employeeName && (
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', marginTop: 6 }}>{employeeName}</p>
        )}
        <p style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>Your monthly payslips. Download any as a PDF.</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'auto' }}>
        <div style={{ ...rowGrid, background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
          {['Month', 'Gross', 'Deductions', 'Net Pay', ''].map((h, i) => (
            <span key={i} style={th}>{h}</span>
          ))}
        </div>

        {isLoading ? (
          <div style={emptyBox}>Loading…</div>
        ) : payslips.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, display: 'inline-block', marginBottom: 14 }}>
              <Inbox size={24} color="#94a3b8" strokeWidth={1.5} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#334155', margin: 0 }}>No payslips yet</p>
            <p style={{ fontSize: 14, color: '#94a3b8', marginTop: 6 }}>They’ll appear here once payroll is run for you.</p>
          </div>
        ) : (
          payslips.map((p, i) => (
            <div key={p.id} style={{ ...rowGrid, borderBottom: i < payslips.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <span style={{ ...td, fontWeight: 600, color: '#0f172a' }}>{MONTHS[p.month - 1]} {p.year}</span>
              <span style={td}>{money(p.grossPay)}</span>
              <span style={td}>{money(p.totalDeductions)}</span>
              <span style={{ ...td, fontWeight: 700, color: '#16A34A' }}>{money(p.netPay)}</span>
              <span style={{ textAlign: 'right' }}>
                <button onClick={() => downloadPayslipPDF(p, brand)} className="btn-primary" style={{ padding: '7px 13px', fontSize: 13 }}>
                  <FileDown size={14} /> PDF
                </button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

const rowGrid = { display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 0.8fr', minWidth: 620, padding: '13px 18px', alignItems: 'center', gap: 8 }
const th = { fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px' }
const td = { fontSize: 14, color: '#475569', whiteSpace: 'nowrap' }
const emptyBox = { padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 14 }
