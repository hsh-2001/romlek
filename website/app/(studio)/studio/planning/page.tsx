'use client';

import type { ChangeEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from 'antd';
import { CalendarDays, CircleDollarSign, ListChecks, Loader2, MapPin, Pencil, Plus, Route, Sparkles, Users, X } from 'lucide-react';
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
  stops: string | null;
  priorities: string | null;
  notes: string | null;
  status: string | null;
};

type PlanningTab = 'editor' | 'plans';

const emptyPlanForm = (): TripPlanForm => ({
  name: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelStyle: '',
  companions: '',
  budget: '',
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

const rowToForm = (row: TripPlanRow): TripPlanForm => ({
  name: row.name || '',
  destination: row.destination || '',
  startDate: formatPlanDate(row.start_date),
  endDate: formatPlanDate(row.end_date),
  travelStyle: row.travel_style || '',
  companions: row.companions || '',
  budget: row.budget || '',
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

  const completedBasics = [
    plan.name.trim(),
    plan.destination.trim(),
    plan.startDate,
    plan.endDate,
    plan.travelStyle,
    plan.stops.trim(),
  ].filter(Boolean).length;

  const cancelEditing = () => {
    setEditingPlanId(null);
    setPlan(emptyPlanForm());
    setError('');
    setMessage('');
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
            <strong>{completedBasics}/6</strong>
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
                      <dl className="planning-details-grid">
                        <div>
                          <dt>{t('planning.destinationLabel')}</dt>
                          <dd>{displayedPlan.destination || t('planning.summaryEmpty')}</dd>
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
                      </dl>
                      <div className="planning-details-notes">
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
