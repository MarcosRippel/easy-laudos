'use client';

import { useState, useEffect } from 'react';
import type { AdminSetting } from '@prisma/client';
import styles from './AdminSettingsForm.module.css';

interface AdminSettingsFormProps {
  initialSettings: AdminSetting;
}

export default function AdminSettingsForm({ initialSettings }: AdminSettingsFormProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    setFormData(initialSettings);
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value as string }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('Saving...');

    let submissionData = { ...formData };

    try {
      if (logoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', logoFile);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!uploadResponse.ok) throw new Error('Logo upload failed.');

        const uploadResult = await uploadResponse.json();
        submissionData.companyLogoUrl = uploadResult.url;
      }

      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings.');
      }

      setMessage('Settings saved successfully!');

    } catch (error) {
      console.error(error);
      setMessage('Error: Could not save settings.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    /* <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem', border: '1px solid #ccc', padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="companyName" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Company Name
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={formData.companyName || ''}
          onChange={handleChange}
          style={{ width: '300px', padding: '0.5rem', fontSize: '1rem' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="companyAddress" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Company Address
        </label>
        <input
          type="text"
          id="companyAddress"
          name="companyAddress"
          value={formData.companyAddress || ''}
          onChange={handleChange}
          style={{ width: '300px', padding: '0.5rem', fontSize: '1rem' }}
        />
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <label htmlFor="companyLogo" style={{ display: 'block', marginBottom: '0.5rem' }}>
          Company Logo
        </label>
        <input type="file" id="companyLogo" name="companyLogo" accept="image/*" onChange={handleFileChange} />
        {formData.companyLogoUrl && !logoFile && (
          <p style={{ fontSize: '0.8rem', color: '#555' }}>Current logo: <a href={formData.companyLogoUrl} target="_blank" rel="noopener noreferrer">{formData.companyLogoUrl}</a></p>
        )}
      </div>

      <hr style={{ margin: '1.5rem 0' }} />

      <div>
        <button type="submit" disabled={isSubmitting} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <span style={{ marginLeft: '1rem', fontStyle: 'italic' }}>{message}</span>}
      </div>
    </form> */
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.inputGroup}>
        <label htmlFor="companyName" className={styles.label}>Company Name</label>
        <input type="text" id="companyName" name="companyName" value={formData.companyName || ''} onChange={handleChange} className={styles.input} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="companyAddress" className={styles.label}>Company Address</label>
        <input type="text" id="companyAddress" name="companyAddress" value={formData.companyAddress || ''} onChange={handleChange} className={styles.input} />
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="companyLogo" className={styles.label}>MEU LOGO</label>
        <div style={{ position: 'relative' }}>
          <input
            type="file"
            id="companyLogo"
            name="companyLogo"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => document.getElementById('companyLogo')?.click()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(23, 162, 184, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(23, 162, 184, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(23, 162, 184, 0.3)';
            }}
          >
            📁 Escolher Arquivo
          </button>
          {logoFile && (
            <span style={{ marginLeft: '1rem', color: '#ccc', fontSize: '0.9rem' }}>
              {logoFile.name}
            </span>
          )}
        </div>
        {formData.companyLogoUrl && !logoFile && (
          <div style={{ marginTop: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>Logo atual:</p>
            <img
              src={formData.companyLogoUrl}
              alt="Logo atual"
              style={{
                maxHeight: '80px',
                maxWidth: '200px',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '1px solid #444',
                padding: '4px',
                background: '#fff'
              }}
            />
          </div>
        )}
      </div>
      <div className={styles.inputGroup}>
        <label htmlFor="nomeResponsavel" className={styles.label}>👨‍🔧 Nome do Responsável (auto-preenchido nos laudos)</label>
        <input
          type="text"
          id="nomeResponsavel"
          name="nomeResponsavel"
          value={(formData as any).nomeResponsavel || ''}
          onChange={handleChange}
          className={styles.input}
          placeholder="Ex: João da Silva - CREA 12345/RS"
        />
      </div>
      <hr style={{ margin: '1.5rem 0', borderColor: '#444' }} />
      <div>
        <button type="submit" disabled={isSubmitting} className={styles.button}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
        {message && <span className={styles.message}>{message}</span>}
      </div>
    </form>
  );
}