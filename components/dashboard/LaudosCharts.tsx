'use client';

import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const TYPE_COLORS: Record<string, string> = {
  CHECKLIST: '#007bff',
  LIT: '#28a745',
  RUIDO: '#ffc107',
  PINO_REI: '#6f42c1',
  QUINTA_RODA: '#dc3545',
};

export interface ChartsData {
  byType: Record<string, number>;
  byMonth: { month: string; count: number }[];
}

export default function LaudosCharts({ data }: { data: ChartsData }) {
  const typeLabels = Object.keys(data.byType);
  if (typeLabels.length === 0) return null;

  const doughnutData = {
    labels: typeLabels,
    datasets: [{
      data: typeLabels.map(l => data.byType[l]),
      backgroundColor: typeLabels.map(l => TYPE_COLORS[l] ?? '#888'),
      borderWidth: 0,
    }],
  };

  const barData = {
    labels: data.byMonth.map(m => m.month),
    datasets: [{
      label: 'Laudos',
      data: data.byMonth.map(m => m.count),
      backgroundColor: '#17a2b8',
      borderRadius: 4,
    }],
  };

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
      <div style={{ background: '#2a2a2e', border: '1px solid #444', borderRadius: '8px', padding: '1.5rem' }}>
        <p style={{ color: '#bbb', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem' }}>
          Por tipo
        </p>
        <Doughnut
          data={doughnutData}
          options={{
            plugins: {
              legend: { labels: { color: '#ccc', font: { size: 11 }, boxWidth: 14 } },
            },
          }}
        />
      </div>
      <div style={{ background: '#2a2a2e', border: '1px solid #444', borderRadius: '8px', padding: '1.5rem' }}>
        <p style={{ color: '#bbb', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 1rem' }}>
          Últimos 6 meses
        </p>
        <Bar
          data={barData}
          options={{
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#999' }, grid: { color: '#333' } },
              y: { ticks: { color: '#999', stepSize: 1 }, grid: { color: '#333' }, beginAtZero: true },
            },
          }}
        />
      </div>
    </section>
  );
}
