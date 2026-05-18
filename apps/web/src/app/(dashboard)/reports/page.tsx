'use client';

// ============================================================
// Reports Page — Export CSV and Excel reports
// ============================================================

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReportsPage() {
  const { data: session } = useSession();
  const token = (session?.user as any)?.accessToken || '';
  const role = (session?.user as any)?.role || 'EMPLOYEE';

  const [loadingType, setLoadingType] = useState<string | null>(null);

  const downloadReport = async (type: string, format: 'csv' | 'excel') => {
    if (!token) return;
    setLoadingType(`${type}-${format}`);
    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/reports/${type}?format=${format}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (!res.ok) throw new Error('Failed to generate report');
      
      // Handle file download
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `atomquest-${type}-report.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Report downloaded successfully');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingType(null);
    }
  };

  if (role === 'EMPLOYEE') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-12 h-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-semibold text-slate-700">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2">Only Managers and Admins can generate reports.</p>
      </div>
    );
  }

  const reports = [
    {
      id: 'goals',
      title: 'Goals Export',
      description: 'Comprehensive list of all goals with current status, weightage, and progress metrics.',
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      id: 'checkins',
      title: 'Check-in History',
      description: 'Historical quarterly check-in data, achievements, and notes.',
      roles: ['MANAGER', 'ADMIN'],
    },
    {
      id: 'audit',
      title: 'Audit Trail',
      description: 'System-wide activity log including goal creation, edits, and approval events.',
      roles: ['ADMIN'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Exports</div>
          <div className="page-subtitle">Generate CSV and Excel reports for offline analysis</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.filter(r => r.roles.includes(role)).map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col"
          >
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{report.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 flex-1 mb-6">{report.description}</p>
            
            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={() => downloadReport(report.id, 'csv')}
                disabled={!!loadingType}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {loadingType === `${report.id}-csv` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                CSV
              </button>
              <button
                onClick={() => downloadReport(report.id, 'excel')}
                disabled={!!loadingType}
                className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 border border-emerald-200 dark:border-emerald-800/30"
              >
                {loadingType === `${report.id}-excel` ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                Excel
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
