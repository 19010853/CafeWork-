import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import styles from './CafeManagementPage.module.css';
import axiosClient from '../../api/axiosClient';
import { t } from '../../utils/i18n';

const CafeManagementPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    openHours: '',
    address: '',
    latitude: '',
    longitude: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMyCafe = async () => {
      try {
        const response = await axiosClient.get('/cafes/my-cafe');
        if (response.data) {
          setFormData(response.data);
        }
      } catch (error) {
        console.error('Error fetching cafe data:', error);
        toast.error(t('fetchCafeFailed'));
      } finally {
        setLoading(false);
      }
    };

    fetchMyCafe();
  }, []);

  const validate = () => {
    if (!formData.name?.trim()) return t('requiredCafeName');
    if (!formData.ownerName?.trim()) return t('requiredOwnerName');
    if (!formData.address?.trim()) return t('requiredAddress');
    
    // Email regex
    if (!formData.email?.trim()) return t('requiredEmail');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return t('invalidEmail');

    // Phone regex (only numbers)
    if (!formData.phone?.trim()) return t('requiredPhone');
    if (!/^\d+$/.test(formData.phone)) return t('invalidPhone');

    // Open hours regex (HH:MM)
    if (formData.openHours && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.openHours)) {
      return t('invalidBusinessHours');
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }

    setSubmitting(true);
    try {
      await axiosClient.put('/cafes/my-cafe', formData);
      toast.success(t('updateSuccess'));
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating cafe:', error);
      const errorMsg = error.response?.data || t('updateFailed');
      toast.error(typeof errorMsg === 'string' ? errorMsg : t('updateError'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: '20px', color: '#8d6e63' }}>{t('loading')}</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{t('cafeManagement')}</h1>
      
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>{t('cafeName')}</label>
            <input
              type="text"
              name="name"
              className={styles.input}
              value={formData.name || ''}
              onChange={handleChange}
              placeholder={t('placeholderCafeName')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('ownerName')}</label>
            <input
              type="text"
              name="ownerName"
              className={styles.input}
              value={formData.ownerName || ''}
              onChange={handleChange}
              placeholder={t('placeholderOwnerName')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('emailAddress')}</label>
            <input
              type="email"
              name="email"
              className={styles.input}
              value={formData.email || ''}
              onChange={handleChange}
              placeholder="example@mail.com"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('phoneNumber')}</label>
            <input
              type="text"
              name="phone"
              className={styles.input}
              value={formData.phone || ''}
              onChange={handleChange}
              placeholder="09012345678"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('businessHours')}</label>
            <input
              type="text"
              name="openHours"
              className={styles.input}
              value={formData.openHours || ''}
              onChange={handleChange}
              placeholder="09:00"
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>{t('address')}</label>
            <input
              type="text"
              name="address"
              className={styles.input}
              value={formData.address || ''}
              onChange={handleChange}
              placeholder={t('placeholderAddress')}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('latitude')}</label>
            <input
              type="number"
              step="any"
              name="latitude"
              className={styles.input}
              value={formData.latitude || ''}
              onChange={handleChange}
              placeholder="35.6895"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>{t('longitude')}</label>
            <input
              type="number"
              step="any"
              name="longitude"
              className={styles.input}
              value={formData.longitude || ''}
              onChange={handleChange}
              placeholder="139.6917"
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>{t('description')}</label>
            <textarea
              name="description"
              className={styles.textarea}
              value={formData.description || ''}
              onChange={handleChange}
              placeholder={t('placeholderDescription')}
            />
          </div>
        </div>

        <button
          type="submit"
          className={styles.saveButton}
          disabled={submitting}
        >
          {submitting ? t('saving') : t('update')}
        </button>
      </form>
    </div>
  );
};

export default CafeManagementPage;
