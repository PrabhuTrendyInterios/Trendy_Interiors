import React, { useEffect, useState, useCallback } from 'react';

import { FaSave, FaUndo } from 'react-icons/fa';

import FormCard from '../components/FormCard';

import { useCms } from '../context/CmsContext';

import { cmsGet, cmsPut, cmsPost } from '../utils/cmsApi';



const defaultSettings = {

  currency: 'INR',

  companyName: 'Trendy Interios',

  contactEmail: '',

  contactPhone: '',

  contactAddress: '',

  estimatorEnabled: true,

};



const SettingsPage = () => {

  const { showToast } = useCms();

  const [form, setForm] = useState(defaultSettings);

  const [loading, setLoading] = useState(true);

  const [submitLoading, setSubmitLoading] = useState(false);



  const fetchSettings = useCallback(async () => {

    try {

      const data = await cmsGet('/settings');

      const settings = data.data || {};

      setForm({

        ...defaultSettings,

        ...settings,

      });

    } catch (error) {

      showToast(error.message, 'error');

    } finally {

      setLoading(false);

    }

  }, [showToast]);



  useEffect(() => {

    fetchSettings();

  }, [fetchSettings]);



  const handleSubmit = async (e) => {

    e.preventDefault();

    setSubmitLoading(true);



    try {

      await cmsPut('/settings', form);

      showToast('Settings saved successfully!', 'success');

      fetchSettings();

    } catch (error) {

      showToast(error.message, 'error');

    } finally {

      setSubmitLoading(false);

    }

  };



  const handleReset = async () => {

    if (!window.confirm('Reset all settings to defaults?')) return;



    setSubmitLoading(true);

    try {

      await cmsPost('/settings/reset', {});

      showToast('Settings reset to defaults', 'success');

      fetchSettings();

    } catch (error) {

      showToast(error.message, 'error');

    } finally {

      setSubmitLoading(false);

    }

  };



  if (loading) {

    return (

      <div className="cms-page">

        <div className="loading-state">

          <div className="spinner" />

          <p>Loading settings...</p>

        </div>

      </div>

    );

  }



  return (

    <div className="cms-page">

      <div className="admin-section-wrapper" style={{ gridTemplateColumns: '1fr' }}>

        <div className="form-section" style={{ maxWidth: '720px' }}>

          <FormCard title="Site Settings" icon={<FaSave />}>

            <form onSubmit={handleSubmit} className="admin-form">

              <div className="form-subsection">

                <h4 className="subsection-title">Company Information</h4>

                <div className="form-group">

                  <label htmlFor="company-name">Company Name</label>

                  <input

                    id="company-name"

                    type="text"

                    value={form.companyName}

                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}

                    className="form-input"

                  />

                </div>

                <div className="form-group">

                  <label htmlFor="contact-email">Contact Email</label>

                  <input

                    id="contact-email"

                    type="email"

                    value={form.contactEmail}

                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}

                    className="form-input"

                  />

                </div>

                <div className="form-group">

                  <label htmlFor="contact-phone">Contact Phone</label>

                  <input

                    id="contact-phone"

                    type="text"

                    value={form.contactPhone}

                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}

                    className="form-input"

                  />

                </div>

                <div className="form-group">

                  <label htmlFor="contact-address">Address</label>

                  <textarea

                    id="contact-address"

                    value={form.contactAddress}

                    onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}

                    rows="2"

                    className="form-textarea"

                  />

                </div>

              </div>



              <div className="form-subsection">

                <h4 className="subsection-title">Estimator</h4>

                <p style={{ margin: '0 0 1rem', color: 'var(--color-gray)', fontSize: '0.9rem' }}>

                  Room pricing is configured per room in the Rooms module (price per sq.ft, layouts, and add-ons).

                </p>

                <div className="form-group">

                  <label htmlFor="currency">Currency</label>

                  <input

                    id="currency"

                    type="text"

                    value={form.currency}

                    onChange={(e) => setForm({ ...form, currency: e.target.value })}

                    className="form-input"

                  />

                </div>

                <div className="form-group checkbox-group">

                  <label>Estimator Enabled</label>

                  <button
                    type="button"
                    className={`form-toggle ${form.estimatorEnabled ? 'checked' : ''}`}
                    onClick={() => setForm({ ...form, estimatorEnabled: !form.estimatorEnabled })}
                    aria-pressed={form.estimatorEnabled}
                    title={form.estimatorEnabled ? 'Disable estimator' : 'Enable estimator'}
                  >
                    {form.estimatorEnabled && <span aria-hidden="true">✓</span>}
                  </button>

                </div>

              </div>



              <div className="form-actions-footer">

                <button type="submit" disabled={submitLoading} className="btn-publish">

                  <FaSave /> {submitLoading ? 'Saving...' : 'Save Settings'}

                </button>

                <button type="button" disabled={submitLoading} onClick={handleReset} className="btn-secondary">

                  <FaUndo /> Reset Defaults

                </button>

              </div>

            </form>

          </FormCard>

        </div>

      </div>

    </div>

  );

};



export default SettingsPage;

