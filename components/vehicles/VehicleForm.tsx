// components/vehicles/VehicleForm.tsx
'use client';

import { useEffect, useState } from 'react';
import styles from './VehicleForm.module.css';

interface VehicleFormProps {
  initialData?: { [key: string]: any } | null;
  clientId?: string;
}

interface VehicleFormData {
  placa: string;
  numeroChassi: string;
  especieTipo: string;
  marcaModelo: string;
  anoFabricacaoModelo: string;
}

const initialFormState: VehicleFormData = {
  placa: '',
  numeroChassi: '',
  especieTipo: '',
  marcaModelo: '',
  anoFabricacaoModelo: '',
};

export default function VehicleForm({ initialData, clientId }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Handle changes in any input field
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle the form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('Saving vehicle...');

    try {
      const vehicleData = {
        ...formData,
        clientId: clientId
      };
      

      const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vehicleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save vehicle.');
      }

      setMessage('Vehicle saved successfully!');
      setFormData(initialFormState); // Clear the form on success

    } catch (error) {
      console.error(error);
      setMessage(error instanceof Error ? `Error: ${error.message}` : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.grid}>
        <InputField label="Placa" name="placa" value={formData.placa} onChange={handleChange} placeholder="e.g., JDM-0F30" />
        <InputField label="Nro. Chassi" name="numeroChassi" value={formData.numeroChassi} onChange={handleChange} placeholder="e.g., 9BM958..." />
        <InputField label="Espécie/Tipo" name="especieTipo" value={formData.especieTipo} onChange={handleChange} placeholder="e.g., CARGA/CAMINHÃO" />
        <InputField label="Marca/Modelo" name="marcaModelo" value={formData.marcaModelo} onChange={handleChange} placeholder="e.g., M.BENZ/7-2430" />
        <InputField label="Ano Fabric./Modelo" name="anoFabricacaoModelo" value={formData.anoFabricacaoModelo} onChange={handleChange} placeholder="e.g., 2019/2020" />
      </div>
      <div style={{ marginTop: '1.5rem' }}>
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Saving...' : 'Save Vehicle'}
        </button>
        {message && <span className={styles.message}>{message}</span>}
      </div>
    </form>
  );
}

// Helper component to avoid repetition
function InputField(props: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, placeholder: string }) {
  return (
    <div className={styles.inputGroup}>
      <label htmlFor={props.name} className={styles.label}>
        {props.label}
      </label>
      <input
        type="text"
        id={props.name}
        name={props.name}
        value={props.value}
        onChange={props.onChange}
        placeholder={props.placeholder}
        required
        className={styles.input}
      />
    </div>
  );
}