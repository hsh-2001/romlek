'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'antd';
import { CalendarDays, CircleDollarSign, ExternalLink, Image as ImageIcon, ListChecks, Loader2, MapPin, Pencil, Plus, Route, Sparkles, Users, X } from 'lucide-react';
import { StudioShell } from '@/app/_components/StudioShell';
import { useAuth } from '@/app/_hooks/useAuth';
import { usePreferences } from '@/app/_hooks/usePreferences';

type TripPlanForm = {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelStyle: string;
  companions: string;
  budget: string;
  address: string;
  googleMapUrl: string;
  placeDetails: string;
  previewMediaUrl: string;
  previewMediaUrls: string[];
  stops: string;
  priorities: string;
  notes: string;
};

type TripPlanRow = {
  id: string | number;
  user_id: string;
  name: string | null;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  travel_style: string | null;
  companions: string | null;
  budget: string | null;
  address: string | null;
  google_map_url: string | null;
  place_details: string | null;
  preview_media_url: string | null;
  preview_media_urls: string[] | null;
  stops: string | null;
  priorities: string | null;
  notes: string | null;
  status: string | null;
};

type UploadResponse = {
  files?: Array<{
    hlsUrl?: string | null;
    media?: {
      file_url?: string | null;
      fileUrl?: string | null;
      hls_url?: string | null;
      hlsUrl?: string | null;
    };
  }>;
};

type PlanningTab = 'editor' | 'plans';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

const emptyPlanForm = (): TripPlanForm => ({
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelStyle: '',
  companions: '',
  budget: '',
  address: '',
  googleMapUrl: '',
  placeDetails: '',
  previewMediaUrl: '',
  previewMediaUrls: [],
  stops: '',
  priorities: '',
  notes: '',
});

const travelStyleLabels: Record<string, string> = {
  solo: 'planning.styleSolo',
  family: 'planning.styleFamily',
  food: 'planning.styleFood',
  nature: 'planning.styleNature',
  business: 'planning.styleBusiness',
};

const formatPlanDate = (value: string | null) => {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
};

const isVideoPreviewUrl = (value: string | null) => {
  return Boolean(value && /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(value));
};

const resolvePreviewUrl = (url: string) => {
  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  const base = new URL(apiBaseUrl);

  if (url.startsWith('/')) {
    const basePath = base.pathname.replace(/\/$/, '');
    const path = basePath && !url.startsWith(`${basePath}/`) ? `${basePath}${url}` : url;
    return `${base.origin}${path}`;
  }

  return new URL(url, `${apiBaseUrl.replace(/\/$/, '')}/`).toString();
};

const uniqueUrls = (urls: string[]) => {
  return Array.from(new Set(urls.map((url) => url.trim()).filter(Boolean)));
};

const getUploadedPreviewUrls = (payload: UploadResponse) => {
  return uniqueUrls((payload.files ?? []).map((uploadedFile) => (
    uploadedFile.media?.hls_url ||
    uploadedFile.media?.hlsUrl ||
    uploadedFile.hlsUrl ||
    uploadedFile.media?.file_url ||
    uploadedFile.media?.fileUrl ||
    ''
  )));
};

const getPlanPreviewMediaUrls = (form: TripPlanForm) => {
  return uniqueUrls([...form.previewMediaUrls, form.previewMediaUrl]);
};

const getRowPreviewMediaUrls = (row: TripPlanRow) => {
  return uniqueUrls([...(Array.isArray(row.preview_media_urls) ? row.preview_media_urls : []), row.preview_media_url || '']);
};

const rowToForm = (row: TripPlanRow): TripPlanForm => ({
  name: row.name || '',
  destination: row.destination || '',
  startDate: formatPlanDate(row.start_date),
  endDate: formatPlanDate(row.end_date),
  travelStyle: row.travel_style || '',
  companions: row.companions || '',
  budget: row.budget || '',
  address: row.address || '',
  googleMapUrl: row.google_map_url || '',
  placeDetails: row.place_details || '',
  previewMediaUrl: row.preview_media_url || '',
  previewMediaUrls: getRowPreviewMediaUrls(row),
  stops: row.stops || '',
  priorities: row.priorities || '',
  notes: row.notes || '',
});

export default function PlanningPage() {
  const { api, user } = useAuth();
  const { t } = usePreferences();
  const [plan, setPlan] = useState<TripPlanForm>(() => emptyPlanForm());
  const [isSaving, setIsSaving] = useState(false);
  const [plans, setPlans] = useState<TripPlanRow[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<TripPlanRow | null>(null);
  const [editingPlanId, setEditingPlanId] = useState<string | number | null>(null);
  const [activeTab, setActiveTab] = useState<PlanningTab>('plans');
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isUploadingPreview, setIsUploadingPreview] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [plansError, setPlansError] = useState('');
  const userId = user?.id !== undefined && user?.id !== null ? String(user.id) : '';

  const loadPlans = useCallback(async () => {
    if (!userId) {
      setPlans([]);
      return;
    }

    setIsLoadingPlans(true);
    setPlansError('');

    try {
      const savedPlans = await api<TripPlanRow[]>(`/trip?user_id=${encodeURIComponent(userId)}`);
      setPlans(savedPlans);
      setSelectedPlan((current) => current ? savedPlans.find((savedPlan) => String(savedPlan.id) === String(current.id)) ?? null : null);
      if (savedPlans.length === 0) {
        setActiveTab('editor');
      }
    } catch (loadError) {
      setPlansError(loadError instanceof Error ? loadError.message : t('planning.loadError'));
    } finally {
      setIsLoadingPlans(false);
    }
  }, [api, t, userId]);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const updatePlan = (key: keyof TripPlanForm) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setPlan((current) => ({ ...current, [key]: event.target.value }));
  };

  const previewMediaUrls = getPlanPreviewMediaUrls(plan);
  const completedBasics = [
    plan.name.trim(),
    plan.destination.trim(),
    plan.startDate,
    plan.endDate,
    plan.travelStyle,
    plan.address.trim(),
    plan.googleMapUrl.trim(),
    previewMediaUrls.length ? 'preview-media' : '',
    plan.placeDetails.trim(),
    plan.stops.trim(),
  ].filter(Boolean).length;

  const cancelEditing = () => {
    setEditingPlanId(null);
    setPlan(emptyPlanForm());
    setError('');
    setMessage('');
  };

  const addPreviewMediaUrl = () => {
    const nextUrl = plan.previewMediaUrl.trim();
    if (!nextUrl) {
      return;
    }

    setPlan((current) => ({
      ...current,
      previewMediaUrl: '',
      previewMediaUrls: uniqueUrls([...current.previewMediaUrls, nextUrl]),
    }));
  };

  const removePreviewMediaUrl = (url: string) => {
    setPlan((current) => ({
      ...current,
      previewMediaUrl: current.previewMediaUrl.trim() === url ? '' : current.previewMediaUrl,
      previewMediaUrls: current.previewMediaUrls.filter((previewUrl) => previewUrl !== url),
    }));
  };

  const uploadPreviewMedia = async (files: File[]) => {
    if (!userId) {
      setError(t('planning.signInRequired'));
      return;
    }

    if (files.length === 0) {
      return;
    }

    if (files.some((file) => !file.type.startsWith('image/') && !file.type.startsWith('video/'))) {
      setError(t('planning.previewUploadTypeError'));
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    formData.append('path', 'planning');
    formData.append('is_public', 'false');
    formData.append('uploaded_by', userId);

    setIsUploadingPreview(true);
    setError('');
    setMessage('');

    try {
      const payload = await api<UploadResponse>('/upload', {
        method: 'POST',
        body: formData,
      });
      const uploadedUrls = getUploadedPreviewUrls(payload);
      if (uploadedUrls.length === 0) {
        throw new Error(t('planning.previewUploadError'));
      }
      setPlan((current) => ({
        ...current,
        previewMediaUrl: '',
        previewMediaUrls: uniqueUrls([...current.previewMediaUrls, ...uploadedUrls]),
      }));
      setMessage(t('planning.previewUploadSuccess'));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : t('planning.previewUploadError'));
    } finally {
      setIsUploadingPreview(false);
    }
  };

  const viewPlan = async (savedPlan: TripPlanRow) => {
    setPlansError('');
    setActiveTab('plans');

    try {
      const planDetails = await api<TripPlanRow>(`/trip/${savedPlan.id}`);
      setSelectedPlan(planDetails);
    } catch (loadError) {
      setPlansError(loadError instanceof Error ? loadError.message : t('planning.loadError'));
      setSelectedPlan(savedPlan);
    }
  };

  const editPlan = async (savedPlan: TripPlanRow) => {
    setError('');
    setMessage('');

    try {
      const planDetails = await api<TripPlanRow>(`/trip/${savedPlan.id}`);
      setSelectedPlan(planDetails);
      setPlan(rowToForm(planDetails));
      setEditingPlanId(planDetails.id);
      setActiveTab('editor');
    } catch (loadError) {
      setPlansError(loadError instanceof Error ? loadError.message : t('planning.loadError'));
      setSelectedPlan(savedPlan);
      setPlan(rowToForm(savedPlan));
      setEditingPlanId(savedPlan.id);
      setActiveTab('editor');
    }
  };

  const savePlan = async () => {
    if (!userId) {
      setError(t('planning.signInRequired'));
      return;
    }

    if (!plan.name.trim() || !plan.destination.trim() || !plan.startDate || !plan.endDate) {
      setError(t('planning.required'));
      return;
    }

    setIsSaving(true);
    setError('');
    setMessage('');

    try {
      const mediaUrls = getPlanPreviewMediaUrls(plan);
      const savedPlan = await api<TripPlanRow>(editingPlanId ? `/trip/${editingPlanId}` : '/trip', {
        method: editingPlanId ? 'PATCH' : 'POST',
        body: {
          user_id: userId,
          name: plan.name.trim(),
          destination: plan.destination.trim(),
          startDate: plan.startDate,
          endDate: plan.endDate,
          travelStyle: plan.travelStyle || null,
          companions: plan.companions.trim() || null,
          budget: plan.budget.trim() || null,
          address: plan.address.trim() || null,
          googleMapUrl: plan.googleMapUrl.trim() || null,
          placeDetails: plan.placeDetails.trim() || null,
          previewMediaUrl: mediaUrls[0] || null,
          previewMediaUrls: mediaUrls,
          stops: plan.stops.trim() || null,
          priorities: plan.priorities.trim() || null,
          notes: plan.notes.trim() || null,
          status: 'planning',
        },
      });
      setPlan(emptyPlanForm());
      setEditingPlanId(null);
      setSelectedPlan(savedPlan);
      setMessage(t(editingPlanId ? 'planning.updateSuccess' : 'planning.createSuccess'));
      await loadPlans();
      setActiveTab('plans');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t(editingPlanId ? 'planning.updateError' : 'planning.createError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <StudioShell active="planning">
      <header className="planning-header">
        <span><Route size={16} aria-hidden="true" /> {t('planning.kicker')}</span>
        <h1>{t('planning.title')}</h1>
        <p>{t('planning.subtitle')}</p>
      </header>

      <nav className="planning-tabs" aria-label={t('planning.tabsLabel')}>
        <Button className={activeTab === 'editor' ? 'active' : ''} icon={<Plus size={16} aria-hidden="true" />} type={activeTab === 'editor' ? 'primary' : 'default'} onClick={() => setActiveTab('editor')}>
          {editingPlanId ? t('planning.editTab') : t('planning.createTab')}
        </Button>
        <Button className={activeTab === 'plans' ? 'active' : ''} icon={<ListChecks size={16} aria-hidden="true" />} type={activeTab === 'plans' ? 'primary' : 'default'} onClick={() => setActiveTab('plans')}>
          {t('planning.listTab')}
        </Button>
      </nav>

      {activeTab === 'editor' ? (
        <section className="planning-page">
        <section className="planning-form" aria-label={t('planning.formTitle')}>
          <div className="planning-form-heading">
            <h2>{editingPlanId ? t('planning.editFormTitle') : t('planning.formTitle')}</h2>
            <p>{t('planning.formBody')}</p>
          </div>

          <div className="planning-section">
            <h3>{t('planning.basicsTitle')}</h3>
            <label>
              <span><Route size={15} aria-hidden="true" /> {t('planning.planNameLabel')}</span>
              <input value={plan.name} disabled={isSaving} placeholder={t('planning.planNamePlaceholder')} onChange={updatePlan('name')} />
            </label>
            <label>
              <span><MapPin size={15} aria-hidden="true" /> {t('planning.destinationLabel')}</span>
              <input value={plan.destination} disabled={isSaving} placeholder={t('planning.destinationPlaceholder')} onChange={updatePlan('destination')} />
            </label>
            <div className="planning-date-grid">
              <label>
                <span><CalendarDays size={15} aria-hidden="true" /> {t('planning.startDateLabel')}</span>
                <input type="date" value={plan.startDate} disabled={isSaving} onChange={updatePlan('startDate')} />
              </label>
              <label>
                <span><CalendarDays size={15} aria-hidden="true" /> {t('planning.endDateLabel')}</span>
                <input type="date" value={plan.endDate} disabled={isSaving} onChange={updatePlan('endDate')} />
              </label>
            </div>
          </div>

          <div className="planning-section two-column">
            <label>
              <span><Sparkles size={15} aria-hidden="true" /> {t('planning.travelStyleLabel')}</span>
              <select value={plan.travelStyle} disabled={isSaving} onChange={updatePlan('travelStyle')}>
                <option value="">{t('planning.travelStylePlaceholder')}</option>
                <option value="solo">{t('planning.styleSolo')}</option>
                <option value="family">{t('planning.styleFamily')}</option>
                <option value="food">{t('planning.styleFood')}</option>
                <option value="nature">{t('planning.styleNature')}</option>
                <option value="business">{t('planning.styleBusiness')}</option>
              </select>
            </label>
            <label>
              <span><Users size={15} aria-hidden="true" /> {t('planning.companionsLabel')}</span>
              <input value={plan.companions} disabled={isSaving} placeholder={t('planning.companionsPlaceholder')} onChange={updatePlan('companions')} />
            </label>
            <label>
              <span><CircleDollarSign size={15} aria-hidden="true" /> {t('planning.budgetLabel')}</span>
              <input value={plan.budget} disabled={isSaving} placeholder={t('planning.budgetPlaceholder')} onChange={updatePlan('budget')} />
            </label>
          </div>

          <div className="planning-section">
            <h3>{t('planning.placeTitle')}</h3>
            <label>
              <span><MapPin size={15} aria-hidden="true" /> {t('planning.addressLabel')}</span>
              <input value={plan.address} disabled={isSaving} placeholder={t('planning.addressPlaceholder')} onChange={updatePlan('address')} />
            </label>
            <div className="planning-section two-column">
              <label>
                <span><ExternalLink size={15} aria-hidden="true" /> {t('planning.googleMapLabel')}</span>
                <input value={plan.googleMapUrl} disabled={isSaving} placeholder={t('planning.googleMapPlaceholder')} onChange={updatePlan('googleMapUrl')} />
              </label>
              <label>
                <span><ImageIcon size={15} aria-hidden="true" /> {t('planning.previewMediaLabel')}</span>
                <div className="planning-preview-url-row">
                  <input value={plan.previewMediaUrl} disabled={isSaving} placeholder={t('planning.previewMediaPlaceholder')} onChange={updatePlan('previewMediaUrl')} />
                  <Button disabled={isSaving || !plan.previewMediaUrl.trim()} onClick={addPreviewMediaUrl}>
                    {t('planning.addPreviewMedia')}
                  </Button>
                </div>
              </label>
            </div>
            <label className="planning-preview-upload">
              <span><ImageIcon size={15} aria-hidden="true" /> {t('planning.previewUploadLabel')}</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                disabled={isSaving || isUploadingPreview}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  event.target.value = '';
                  if (files.length > 0) {
                    void uploadPreviewMedia(files);
                  }
                }}
              />
              <small>{isUploadingPreview ? t('planning.previewUploading') : t('planning.previewUploadBody')}</small>
            </label>
            {previewMediaUrls.length > 0 ? (
              <div className="planning-preview-list" aria-label={t('planning.previewSelectedLabel')}>
                {previewMediaUrls.map((url) => {
                  const resolvedUrl = resolvePreviewUrl(url);

                  return (
                    <figure key={url} className="planning-preview-item">
                      {isVideoPreviewUrl(url) ? (
                        <video src={resolvedUrl} controls muted playsInline />
                      ) : (
                        <img src={resolvedUrl} alt={t('planning.previewSelectedLabel')} />
                      )}
                      <button type="button" onClick={() => removePreviewMediaUrl(url)} aria-label={t('planning.removePreviewMedia')}>
                        <X size={14} aria-hidden="true" />
                      </button>
                    </figure>
                  );
                })}
              </div>
            ) : null}
            <label>
              <span><Sparkles size={15} aria-hidden="true" /> {t('planning.placeDetailsLabel')}</span>
              <textarea value={plan.placeDetails} disabled={isSaving} placeholder={t('planning.placeDetailsPlaceholder')} rows={3} onChange={updatePlan('placeDetails')} />
            </label>
          </div>

          <div className="planning-section">
            <h3>{t('planning.routeTitle')}</h3>
            <label>
              <span><Route size={15} aria-hidden="true" /> {t('planning.stopsLabel')}</span>
              <textarea value={plan.stops} disabled={isSaving} placeholder={t('planning.stopsPlaceholder')} rows={4} onChange={updatePlan('stops')} />
            </label>
            <label>
              <span><Sparkles size={15} aria-hidden="true" /> {t('planning.prioritiesLabel')}</span>
              <textarea value={plan.priorities} disabled={isSaving} placeholder={t('planning.prioritiesPlaceholder')} rows={3} onChange={updatePlan('priorities')} />
            </label>
            <label>
              <span><MapPin size={15} aria-hidden="true" /> {t('planning.notesLabel')}</span>
              <textarea value={plan.notes} disabled={isSaving} placeholder={t('planning.notesPlaceholder')} rows={3} onChange={updatePlan('notes')} />
            </label>
          </div>

          {message ? <p className="planning-status success">{message}</p> : null}
          {error ? <p className="planning-status error">{error}</p> : null}
          <div className="planning-form-actions">
            <Button type="primary" className="planning-save-button" loading={isSaving} icon={<Plus size={17} aria-hidden="true" />} onClick={() => void savePlan()}>
              {editingPlanId ? t('planning.updatePlan') : t('planning.savePlan')}
            </Button>
            {editingPlanId ? (
              <Button className="planning-cancel-button" icon={<X size={17} aria-hidden="true" />} onClick={cancelEditing}>
                {t('planning.cancelEdit')}
              </Button>
            ) : null}
          </div>
        </section>

        <aside className="planning-summary" aria-label={t('planning.summaryTitle')}>
          <span><Sparkles size={15} aria-hidden="true" /> {t('planning.summaryTitle')}</span>
          <h2>{plan.name.trim() || t('planning.summaryUntitled')}</h2>
          <dl>
            <div>
              <dt>{t('planning.destinationLabel')}</dt>
              <dd>{plan.destination.trim() || t('planning.summaryEmpty')}</dd>
            </div>
            <div>
              <dt>{t('planning.dateRangeLabel')}</dt>
              <dd>{plan.startDate && plan.endDate ? `${plan.startDate} - ${plan.endDate}` : t('planning.summaryEmpty')}</dd>
            </div>
            <div>
              <dt>{t('planning.travelStyleLabel')}</dt>
              <dd>{plan.travelStyle ? t(travelStyleLabels[plan.travelStyle]) : t('planning.summaryEmpty')}</dd>
            </div>
          </dl>
          <div className="planning-readiness">
            <strong>{completedBasics}/10</strong>
            <span>{t('planning.readinessLabel')}</span>
          </div>
        </aside>
      </section>
      ) : null}

      {activeTab === 'plans' ? (
        <section className="planning-saved" aria-label={t('planning.listTab')}>
        <div className="planning-list-toolbar">
          <span>{t('planning.planCount', { count: plans.length })}</span>
          <Button icon={<Plus size={15} aria-hidden="true" />} onClick={() => setActiveTab('editor')}>
            {t('planning.createTab')}
          </Button>
        </div>
        {isLoadingPlans ? (
          <p className="planning-saved-state"><Loader2 size={16} aria-hidden="true" /> {t('planning.loadingPlans')}</p>
        ) : null}
        {plansError ? <p className="planning-status error">{plansError}</p> : null}
        {!isLoadingPlans && !plansError && plans.length === 0 ? <p className="planning-saved-state">{t('planning.noPlans')}</p> : null}
        {plans.length > 0 ? (
          <div className="planning-saved-grid">
            {plans.map((savedPlan) => {
              const startDate = formatPlanDate(savedPlan.start_date);
              const endDate = formatPlanDate(savedPlan.end_date);
              const isSelected = selectedPlan ? String(selectedPlan.id) === String(savedPlan.id) : false;
              const displayedPlan = isSelected && selectedPlan ? selectedPlan : savedPlan;
              const displayedPreviewUrls = getRowPreviewMediaUrls(displayedPlan);

              return (
                <article key={savedPlan.id} className={`planning-saved-card ${isSelected ? 'active' : ''}`}>
                  <button className="planning-saved-card-summary" type="button" aria-expanded={isSelected} onClick={() => isSelected ? setSelectedPlan(null) : void viewPlan(savedPlan)}>
                    <span>
                      <h3>{savedPlan.name || savedPlan.destination || t('planning.summaryUntitled')}</h3>
                      <p><CalendarDays size={14} aria-hidden="true" /> {startDate && endDate ? `${startDate} - ${endDate}` : t('planning.summaryEmpty')}</p>
                    </span>
                  </button>
                  {isSelected ? (
                    <div className="planning-saved-card-details">
                      {displayedPreviewUrls.length > 0 ? (
                        <div className="planning-place-preview-grid">
                          {displayedPreviewUrls.map((url) => (
                            <div key={url} className="planning-place-preview">
                              {isVideoPreviewUrl(url) ? (
                                <video src={resolvePreviewUrl(url)} controls muted playsInline />
                              ) : (
                                <img src={resolvePreviewUrl(url)} alt={displayedPlan.name || displayedPlan.destination || t('planning.summaryUntitled')} />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <dl className="planning-details-grid">
                        <div>
                          <dt>{t('planning.destinationLabel')}</dt>
                          <dd>{displayedPlan.destination || t('planning.summaryEmpty')}</dd>
                        </div>
                        <div>
                          <dt>{t('planning.addressLabel')}</dt>
                          <dd>{displayedPlan.address || t('planning.summaryEmpty')}</dd>
                        </div>
                        <div>
                          <dt>{t('planning.travelStyleLabel')}</dt>
                          <dd>{displayedPlan.travel_style ? t(travelStyleLabels[displayedPlan.travel_style] || 'planning.summaryEmpty') : t('planning.summaryEmpty')}</dd>
                        </div>
                        <div>
                          <dt>{t('planning.companionsLabel')}</dt>
                          <dd>{displayedPlan.companions || t('planning.summaryEmpty')}</dd>
                        </div>
                        <div>
                          <dt>{t('planning.budgetLabel')}</dt>
                          <dd>{displayedPlan.budget || t('planning.summaryEmpty')}</dd>
                        </div>
                        <div>
                          <dt>{t('planning.googleMapLabel')}</dt>
                          <dd>
                            {displayedPlan.google_map_url ? (
                              <a href={displayedPlan.google_map_url} target="_blank" rel="noreferrer">{t('planning.openMap')}</a>
                            ) : t('planning.summaryEmpty')}
                          </dd>
                        </div>
                      </dl>
                      <div className="planning-details-notes">
                        <section>
                          <h3>{t('planning.placeDetailsLabel')}</h3>
                          <p>{displayedPlan.place_details || t('planning.summaryEmpty')}</p>
                        </section>
                        <section>
                          <h3>{t('planning.stopsLabel')}</h3>
                          <p>{displayedPlan.stops || t('planning.summaryEmpty')}</p>
                        </section>
                        <section>
                          <h3>{t('planning.prioritiesLabel')}</h3>
                          <p>{displayedPlan.priorities || t('planning.summaryEmpty')}</p>
                        </section>
                        <section>
                          <h3>{t('planning.notesLabel')}</h3>
                          <p>{displayedPlan.notes || t('planning.summaryEmpty')}</p>
                        </section>
                      </div>
                      <div className="planning-card-actions">
                        <Button icon={<Pencil size={15} aria-hidden="true" />} onClick={() => void editPlan(displayedPlan)}>
                          {t('planning.editPlan')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}
        </section>
      ) : null}
    </StudioShell>
  );
}
