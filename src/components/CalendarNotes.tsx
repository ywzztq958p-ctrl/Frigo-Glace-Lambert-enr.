/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar as CalendarIcon, 
  Clock, 
  FileText, 
  PlusCircle, 
  Search, 
  Filter, 
  Check, 
  AlertCircle, 
  Bell, 
  ChevronLeft, 
  ChevronRight,
  Info,
  Wrench,
  Truck,
  IceCream,
  CalendarDays,
  X,
  RefreshCw
} from 'lucide-react';
import { CalendarEvent, EventCategory, QuickNote } from '../types';
import { 
  connectGoogleServices, 
  getCachedToken, 
  createGoogleCalendarEvent, 
  listGoogleCalendarEvents 
} from '../googleWorkspace';

interface CalendarNotesProps {
  categories: EventCategory[];
  events: CalendarEvent[];
  notes: QuickNote[];
  onAddCategory: (cat: Omit<EventCategory, 'id'>) => void;
  onDeleteCategory: (id: string) => void;
  onAddEvent: (evt: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  onUpdateEvent: (id: string, updated: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  onAddNote: (note: Omit<QuickNote, 'id'>) => void;
  onUpdateNote: (id: string, updated: Partial<QuickNote>) => void;
  onDeleteNote: (id: string) => void;
}

export default function CalendarNotes({
  categories,
  events,
  notes,
  onAddCategory,
  onDeleteCategory,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddNote,
  onUpdateNote,
  onDeleteNote
}: CalendarNotesProps) {

  // Visual sub-navigation tabs
  const [activeWidget, setActiveWidget] = useState<'calendar' | 'notes' | 'categories'>('calendar');

  // Month navigation state
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 5, 1)); // Default June 2026 for initial view
  const [selectedDayStr, setSelectedDayStr] = useState<string>('2026-06-14');

  // Google Calendar Integration states
  const [googleEvents, setGoogleEvents] = useState<any[]>([]);
  const [googleCalendarLoading, setGoogleCalendarLoading] = useState<boolean>(false);
  const [googleConnected, setGoogleConnected] = useState<boolean>(!!getCachedToken());
  const [gcalSyncEnabled, setGcalSyncEnabled] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleFetchGoogleCalendar = async () => {
    if (!getCachedToken()) {
      setGoogleConnected(false);
      return;
    }
    setGoogleCalendarLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const firstDay = new Date(Date.UTC(year, month, 1, 0, 0, 0)).toISOString();
      const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();
      const items = await listGoogleCalendarEvents(firstDay, lastDay);
      setGoogleEvents(items);
      setGoogleConnected(true);
    } catch (err: any) {
      console.error('Google Calendar Sync Error:', err);
      if (err.message?.includes('401') || err.message?.toLowerCase().includes('authorized')) {
        setGoogleConnected(false);
      }
    } finally {
      setGoogleCalendarLoading(false);
    }
  };

  const handleGoogleConnectLocal = async () => {
    try {
      setGoogleCalendarLoading(true);
      await connectGoogleServices();
      setGoogleConnected(true);
      setGcalSyncEnabled(true);
      // Wait for cache token to be set
      setTimeout(() => {
        handleFetchGoogleCalendar();
      }, 300);
    } catch (err: any) {
      alert(`Erreur de connexion Google Services : ${err.message || err}`);
    } finally {
      setGoogleCalendarLoading(false);
    }
  };

  const handleExportToGoogleCalendar = async (evt: CalendarEvent) => {
    const confirmExport = window.confirm(`Exporter l'événement "${evt.title}" vers ton Google Calendar principal ?`);
    if (!confirmExport) return;

    try {
      setSyncStatus(`Exportation de "${evt.title}"...`);
      const eventCat = categories.find(c => c.id === evt.category);
      const categoryName = eventCat ? `[${eventCat.name}] ` : '';
      const finalTitle = `${categoryName}${evt.title}`;
      const finalDesc = evt.description || 'Créé via Frigo-Glace Pay';
      
      await createGoogleCalendarEvent(finalTitle, finalDesc, evt.date, evt.time, evt.duration);
      setSyncStatus(`✓ Événement "${evt.title}" exporté avec succès !`);
      setTimeout(() => setSyncStatus(null), 4000);
      
      if (gcalSyncEnabled) {
        handleFetchGoogleCalendar();
      }
    } catch (err: any) {
      console.error(err);
      alert(`Erreur d'exportation Google Calendar : ${err.message || err}`);
      setSyncStatus(null);
    }
  };

  useEffect(() => {
    if (gcalSyncEnabled && getCachedToken()) {
      handleFetchGoogleCalendar();
    }
  }, [currentMonth, gcalSyncEnabled]);

  useEffect(() => {
    setGoogleConnected(!!getCachedToken());
  }, []);

  // Sub-states: Event Form
  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventTime, setEventTime] = useState('08:00');
  const [eventDuration, setEventDuration] = useState('8h');
  const [eventCatId, setEventCatId] = useState(categories[0]?.id || 'cat-1');
  const [eventReminder, setEventReminder] = useState(false);
  const [eventReminderTime, setEventReminderTime] = useState('15m');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Sub-states: Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('blue');
  const [newCatIcon, setNewCatIcon] = useState('CalendarDays');

  // Sub-states: Notes Form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCatId, setNoteCatId] = useState<string>('none');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Sorting & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [noteFilterCatId, setNoteFilterCatId] = useState('all');
  const [noteSortOrder, setNoteSortOrder] = useState<'desc' | 'asc'>('desc');

  // Categories choices
  const COLOR_CHOICES = ['blue', 'emerald', 'amber', 'violet', 'rose', 'indigo', 'slate'];
  const ICON_CHOICES = ['IceCream', 'Truck', 'Wrench', 'CalendarDays'];

  // Render Icon helper
  const renderCategoryIcon = (iconName: string, size = 14, className = "") => {
    switch(iconName) {
      case 'IceCream': return <IceCream size={size} className={className} />;
      case 'Truck': return <Truck size={size} className={className} />;
      case 'Wrench': return <Wrench size={size} className={className} />;
      default: return <CalendarDays size={size} className={className} />;
    }
  };

  // Color mapper helper
  const getTailwindBgColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'emerald': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'amber': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'violet': return 'bg-violet-100 text-violet-800 border-violet-200';
      case 'rose': return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'indigo': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getTailwindBorderColor = (color: string) => {
    switch (color) {
      case 'blue': return 'border-blue-500';
      case 'emerald': return 'border-emerald-500';
      case 'amber': return 'border-amber-500';
      case 'violet': return 'border-violet-500';
      case 'rose': return 'border-rose-500';
      case 'indigo': return 'border-indigo-500';
      default: return 'border-slate-500';
    }
  };

  const getTailwindBadgeColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-500';
      case 'emerald': return 'bg-emerald-500';
      case 'amber': return 'bg-amber-500';
      case 'violet': return 'bg-violet-500';
      case 'rose': return 'bg-rose-500';
      case 'indigo': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  // Generate monthly calendar dates
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Start day of the month
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Number of days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Array of day details
    const days = [];
    
    // Fill dummy padding days for first week starting offset
    for (let i = 0; i < (firstDayIndex || 7) - 1; i++) {
      days.push(null);
    }

    // Fill real days
    for (let d = 1; d <= totalDays; d++) {
      const dayStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
      days.push({
        num: d,
        dateStr: dayStr
      });
    }

    return days;
  };

  const calendarDays = getDaysInMonth();
  const selectedDayEvents = events.filter(e => e.date === selectedDayStr);
  const selectedDayGCalEvents = googleEvents.filter(ge => {
    const geDateStr = ge.start?.dateTime?.split('T')[0] || ge.start?.date;
    return geDateStr === selectedDayStr;
  });

  // CATEGORY HANDLING
  const handleAddCatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    onAddCategory({
      name: newCatName.trim(),
      color: newCatColor,
      icon: newCatIcon
    });
    setNewCatName('');
  };

  // EVENT HANDLING
  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    if (editingEventId) {
      onUpdateEvent(editingEventId, {
        title: eventTitle,
        description: eventDesc,
        time: eventTime,
        duration: eventDuration,
        category: eventCatId,
        reminder: eventReminder,
        reminderTime: eventReminder ? eventReminderTime : 'none',
        date: selectedDayStr
      });
      setEditingEventId(null);
    } else {
      onAddEvent({
        title: eventTitle,
        description: eventDesc,
        date: selectedDayStr,
        time: eventTime,
        duration: eventDuration,
        category: eventCatId,
        reminder: eventReminder,
        reminderTime: eventReminder ? eventReminderTime : 'none'
      });
    }

    // Reset Form
    setEventTitle('');
    setEventDesc('');
    setEventTime('08:00');
    setEventDuration('8h');
    setEventReminder(false);
    setEventReminderTime('15m');
  };

  const startEditEvent = (evt: CalendarEvent) => {
    setEditingEventId(evt.id);
    setEventTitle(evt.title);
    setEventDesc(evt.description);
    setEventTime(evt.time);
    setEventDuration(evt.duration);
    setEventCatId(evt.category);
    setEventReminder(evt.reminder);
    setEventReminderTime(evt.reminderTime || '15m');
  };

  // NOTES HANDLING
  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingNoteId) {
      onUpdateNote(editingNoteId, {
        title: noteTitle,
        content: noteContent,
        categoryId: noteCatId === 'none' ? null : noteCatId,
      });
      setEditingNoteId(null);
    } else {
      onAddNote({
        title: noteTitle,
        content: noteContent,
        date: todayStr,
        categoryId: noteCatId === 'none' ? null : noteCatId,
      });
    }

    // Reset notes form
    setNoteTitle('');
    setNoteContent('');
    setNoteCatId('none');
  };

  const startEditNote = (note: QuickNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteCatId(note.categoryId || 'none');
  };

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchQuery = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         note.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCat = noteFilterCatId === 'all' || 
                        (noteFilterCatId === 'null' && !note.categoryId) || 
                        note.categoryId === noteFilterCatId;
      
      return matchQuery && matchCat;
    })
    .sort((a, b) => {
      if (noteSortOrder === 'desc') {
        return b.date.localeCompare(a.date);
      } else {
        return a.date.localeCompare(b.date);
      }
    });

  return (
    <div className="space-y-6" id="calendar-notes-tab">
      
      {/* Sub Widgets Tabs rail */}
      <div className="flex bg-white border border-slate-100 rounded-xl p-1 gap-1 max-w-md shadow-2xs">
        <button
          onClick={() => setActiveWidget('calendar')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
            activeWidget === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CalendarIcon size={14} className="mr-1.5" /> Calendrier
        </button>
        <button
          onClick={() => setActiveWidget('notes')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
            activeWidget === 'notes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={14} className="mr-1.5" /> Notes Rapides
        </button>
        <button
          onClick={() => setActiveWidget('categories')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
            activeWidget === 'categories' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <PlusCircle size={14} className="mr-1.5" /> Catégories
        </button>
      </div>

      {/* VIEW A: INTERACTIVE MONTHLY CALENDAR */}
      {activeWidget === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="calendar-tab-view">
          
          {/* Monthly grid and visual map */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 font-sans">Shift Planner</h3>
                <p className="text-[11px] text-slate-400">Cliquez sur un jour pour planifier/consulter vos shifts</p>
              </div>

              {/* Navigation button */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 border border-slate-200 hover:bg-slate-50 rounded"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-slate-700 min-w-28 text-center font-mono uppercase">
                  {currentMonth.toLocaleString('fr-CA', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 border border-slate-200 hover:bg-slate-50 rounded"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Google Calendar sync bar */}
            <div className="bg-slate-50 border border-slate-205 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm-5-3h5v-5h-5v5z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    Google Calendar
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${googleConnected ? 'bg-emerald-500' : 'bg-slate-350'}`} />
                  </h4>
                  <p className="text-[10px] text-slate-400">Affiche et exporte tes shifts chez Google Calendar</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {googleConnected ? (
                  <>
                    <div className="flex items-center gap-2 border-r border-slate-200 pr-2 MR-1">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={gcalSyncEnabled}
                          onChange={(e) => setGcalSyncEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-1.5 text-[9.5px] font-bold text-slate-600">Afficher</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={googleCalendarLoading}
                      onClick={handleFetchGoogleCalendar}
                      className="px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg font-bold text-[9px] transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw size={8} className={googleCalendarLoading ? 'animate-spin' : ''} />
                      <span>Rafraîchir</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleGoogleConnectLocal}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[9.5px] font-sans transition flex items-center gap-1 hover:shadow-3xs cursor-pointer"
                  >
                    Activer la synchronisation
                  </button>
                )}
              </div>
            </div>

            {syncStatus && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[10.5px] font-bold flex items-center gap-1 animate-pulse">
                <span>{syncStatus}</span>
              </div>
            )}

            {/* Grid Days headings */}
            <div className="grid grid-cols-7 text-center text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
              <span>Lun</span><span>Mar</span><span>Mer</span><span>Jeu</span><span>Ven</span><span>Sam</span><span>Dim</span>
            </div>

            {/* Dates list */}
            <div className="grid grid-cols-7 gap-1.5" id="calendar-grid-cells">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-10 sm:h-12 bg-slate-50/20 rounded-md" />;

                const isSelected = day.dateStr === selectedDayStr;
                const matchesEvents = events.filter(e => e.date === day.dateStr);
                
                // Match Google Calendar events for this day
                const matchesGCalEvents = googleEvents.filter(ge => {
                  const geDateStr = ge.start?.dateTime?.split('T')[0] || ge.start?.date;
                  return geDateStr === day.dateStr;
                });
                
                return (
                  <div
                    key={day.dateStr}
                    onClick={() => setSelectedDayStr(day.dateStr)}
                    className={`h-11 sm:h-14 p-1 rounded-lg border transition flex flex-col justify-between cursor-pointer select-none ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/10' 
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-xs font-black font-mono w-5 h-5 flex items-center justify-center rounded-full ${
                      isSelected ? 'bg-blue-600 text-white' : 'text-slate-700'
                    }`}>
                      {day.num}
                    </span>

                    {/* Dots indicators categories of day */}
                    <div className="flex space-x-0.5 justify-center mt-1">
                      {matchesEvents.slice(0, 3).map(evt => {
                        const eventCat = categories.find(c => c.id === evt.category);
                        const dotColor = eventCat ? getTailwindBadgeColor(eventCat.color) : 'bg-slate-400';
                        return (
                          <span 
                            key={evt.id} 
                            className={`w-1.5 h-1.5 rounded-full ${dotColor}`} 
                            title={evt.title} 
                          />
                        );
                      })}
                      {gcalSyncEnabled && matchesGCalEvents.slice(0, 2).map((ge, gIdx) => (
                        <span 
                          key={`gcal-dot-${gIdx}`}
                          className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse border border-white"
                          title={`GCal: ${ge.summary || '(Sans titre)'}`}
                        />
                      ))}
                      {(matchesEvents.length + (gcalSyncEnabled ? matchesGCalEvents.length : 0)) > 3 && (
                        <span className="text-[7px] text-slate-400 font-bold shrink-0 font-mono">+</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selection indicators notes */}
            <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs flex justify-between items-center text-blue-900">
              <span className="font-semibold">Option sélectionnée : <strong className="font-mono">{selectedDayStr}</strong></span>
              <span className="text-[10px] font-bold text-blue-600 font-mono bg-blue-100 px-2 py-0.5 rounded uppercase">
                {selectedDayEvents.length} action(s)
              </span>
            </div>
          </div>

          {/* Day events visual details & form */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Event list of day */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Shifts & Tâches ({selectedDayStr})
              </h4>
              
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {selectedDayEvents.length === 0 && (!gcalSyncEnabled || selectedDayGCalEvents.length === 0) ? (
                  <div className="text-center py-6 text-slate-400 text-xs italic">
                    Aucun événement ou shift enregistré pour ce jour.
                  </div>
                ) : (
                  <>
                    {selectedDayEvents.map(evt => {
                      const eventCat = categories.find(c => c.id === evt.category);
                      const colorClasses = eventCat ? getTailwindBgColor(eventCat.color) : 'bg-slate-100 text-slate-700';
                      const borderStyles = eventCat ? getTailwindBorderColor(eventCat.color) : 'border-slate-300';
                      
                      return (
                        <div key={evt.id} className={`p-3 border-l-4 ${borderStyles} bg-slate-50 rounded-r-lg space-y-1 relative`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-slate-800">{evt.title}</span>
                              {eventCat && (
                                <span className={`ml-2 text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded border ${colorClasses}`}>
                                  {eventCat.name}
                                </span>
                              )}
                            </div>
                            
                            {/* Actions (Export to Google Calendar, Edit, Delete) */}
                            <div className="flex items-center space-x-1 shrink-0">
                              {googleConnected && (
                                <button
                                  type="button"
                                  onClick={() => handleExportToGoogleCalendar(evt)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                                  title="Exporter vers Google Calendar"
                                >
                                  <CalendarIcon size={12} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => startEditEvent(evt)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteEvent(evt.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded animate-duration-150"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {evt.description && (
                            <p className="text-[11px] text-slate-500 italic">"{evt.description}"</p>
                          )}

                          <div className="flex items-center space-x-3 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center"><Clock size={11} className="mr-0.5" /> {evt.time} ({evt.duration})</span>
                            {evt.reminder && (
                              <span className="flex items-center text-amber-500">
                                <Bell size={11} className="mr-0.5 animate-bounce-subtle" /> 
                                Rappel : {
                                  evt.reminderTime === '00m' || evt.reminderTime === '0m' ? "à l'heure" :
                                  evt.reminderTime === '15m' ? '15 min avant' :
                                  evt.reminderTime === '1h' ? '1 hr avant' :
                                  evt.reminderTime === '1d' ? '1 jour avant' : 'Activé'
                                }
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Google Calendar Integrated Events list */}
                    {gcalSyncEnabled && selectedDayGCalEvents.length > 0 && (
                      <div className="pt-2.5 border-t border-slate-100 mt-2.5 space-y-2">
                        <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1">
                          Événements Google Calendar
                        </div>
                        {selectedDayGCalEvents.map((ge, gIdx) => {
                          const timeString = ge.start?.dateTime 
                            ? new Date(ge.start.dateTime).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }) 
                            : 'Toute la journée';
                          
                          return (
                            <div key={`gcal-item-${gIdx}`} className="p-2.5 border-l-4 border-blue-500 bg-blue-50/20 rounded-r-lg space-y-1 relative">
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                  {ge.summary || '(Sans titre)'}
                                </span>
                                <span className="text-[7px] uppercase font-black bg-blue-100 text-blue-600 px-1.5 py-0.2 rounded border border-blue-200">
                                  GCal
                                </span>
                              </div>
                              {ge.description && (
                                <p className="text-[10px] text-slate-500 italic">"{ge.description}"</p>
                              )}
                              <div className="text-[9.5px] text-slate-400 font-mono flex items-center">
                                <Clock size={10} className="mr-0.5 text-blue-400" /> {timeString}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Event Form addition picker */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wide">
                {editingEventId ? 'Modifier l\'événement' : 'Planifier un shift / tâche'}
              </h4>

              <form onSubmit={handleEventSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Titre</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Quart de production matin ❄️"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Détails du shift / consignes particulières..."
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Heure de début</label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Durée</label>
                    <input
                      type="text"
                      placeholder="Ex: 8h, 2h30"
                      value={eventDuration}
                      onChange={(e) => setEventDuration(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-2.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-center text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Catégorie</label>
                    <select
                      value={eventCatId}
                      onChange={(e) => setEventCatId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-md py-1 px-1 text-xs"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center pt-3.5 pl-2">
                    <input
                      type="checkbox"
                      id="eventReminder"
                      checked={eventReminder}
                      onChange={(e) => setEventReminder(e.target.checked)}
                      className="mr-1.5 focus:outline-hidden cursor-pointer"
                    />
                    <label htmlFor="eventReminder" className="text-[10px] font-bold text-slate-500 uppercase cursor-pointer flex items-center select-none">
                      <Bell size={11} className="mr-0.5 text-amber-500 shrink-0" /> Activer Rappel
                    </label>
                  </div>
                </div>

                {eventReminder && (
                  <div className="p-3 bg-amber-50/40 border border-amber-100 rounded-lg text-xs space-y-1 mt-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Temps de Rappel</label>
                    <select
                      value={eventReminderTime}
                      onChange={(e) => setEventReminderTime(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-md py-1 px-2 text-xs"
                    >
                      <option value="0m">Au moment de l'événement</option>
                      <option value="15m">15 minutes avant</option>
                      <option value="1h">1 heure avant</option>
                      <option value="1d">1 jour avant</option>
                    </select>
                  </div>
                )}

                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs leading-loose transition text-center"
                  >
                    {editingEventId ? 'Mettre à jour' : 'Enregistrer le shift'}
                  </button>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingEventId(null);
                        setEventTitle('');
                        setEventDesc('');
                      }}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-1.5 px-3 rounded-lg text-xs leading-loose transition"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* VIEW B: STICKY NOTES FOR QUICK RECORDING */}
      {activeWidget === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="notes-tab-view">
          
          {/* Notes manager and custom list filter */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Options bar, query search & category filter */}
            <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-xs w-full">
                <input
                  type="text"
                  placeholder="Chercher une note..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-hidden focus:border-blue-400"
                />
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                {/* Category select filter */}
                <span className="text-slate-400 font-semibold"><Filter size={12} className="inline mr-1" /> Catégorie:</span>
                <select
                  value={noteFilterCatId}
                  onChange={(e) => setNoteFilterCatId(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-600"
                >
                  <option value="all">Toutes</option>
                  <option value="null">Sans catégorie</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>

                {/* Sort selector */}
                <button
                  onClick={() => setNoteSortOrder(noteSortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg text-slate-600"
                >
                  Date : {noteSortOrder === 'desc' ? 'Plus récentes' : 'Plus anciennes'}
                </button>
              </div>
            </div>

            {/* Grid of sticky notes card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="sticky-notes-card-grid">
              {filteredNotes.length === 0 ? (
                <div className="col-span-full bg-white border border-slate-100 rounded-xl p-10 text-center text-slate-400">
                  <FileText size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">Aucune note rapide enregistrée.</p>
                </div>
              ) : (
                filteredNotes.map(note => {
                  const noteCat = categories.find(c => c.id === note.categoryId);
                  const colorClasses = noteCat ? getTailwindBgColor(noteCat.color) : 'bg-yellow-105 border-yellow-200';
                  
                  return (
                    <div 
                      key={note.id}
                      className={`p-4 bg-yellow-50/50 border border-yellow-250/20 rounded-xl shadow-2xs hover:shadow-xs transition relative overflow-hidden flex flex-col justify-between`}
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-black text-slate-900 truncate">{note.title}</h4>
                          <div className="flex items-center space-x-1 shrink-0">
                            <button
                              onClick={() => startEditNote(note)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {noteCat && (
                          <span className={`inline-flex items-center text-[10px] font-bold py-0.5 px-2 rounded-full border ${colorClasses}`}>
                            {renderCategoryIcon(noteCat.icon, 10, "mr-1")}
                            {noteCat.name}
                          </span>
                        )}

                        <p className="text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                        <span>Zachary Martel</span>
                        <span>{note.date}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Form Create Note sidebar panel */}
          <div className="lg:col-span-4">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
                {editingNoteId ? 'Modifier la Note' : 'Ajouter une Note Rapide'}
              </h3>

              <form onSubmit={handleNoteSubmit} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Titre de la note</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Tâches de fermeture"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Contenu</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Ecrire les détails de ta note..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-2.5 text-xs focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">Lier à une Catégorie</label>
                  <select
                    value={noteCatId}
                    onChange={(e) => setNoteCatId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-1.5 px-1 text-xs"
                  >
                    <option value="none">Aucune catégorie</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs leading-loose transition"
                  >
                    {editingNoteId ? 'Mettre à jour' : 'Épingler la note'}
                  </button>
                  {editingNoteId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(null);
                        setNoteTitle('');
                        setNoteContent('');
                        setNoteCatId('none');
                      }}
                      className="border border-slate-200 hover:bg-slate-50 text-slate-500 font-bold py-1.5 px-3 rounded-lg text-xs leading-loose transition"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

        </div>
      )}

      {/* VIEW C: EDIT CATEGORIES PANEL */}
      {activeWidget === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="categories-tab-view">
          
          {/* Categories creation form card */}
          <div className="lg:col-span-5 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-black tracking-wider uppercase text-slate-400">
              Créer une Catégorie Personnalisée
            </h3>

            <form onSubmit={handleAddCatSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nom de la catégorie</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: École, Rendez-vous..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-xs focus:outline-hidden focus:border-blue-400"
                />
              </div>

              {/* Color grid choice */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_CHOICES.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCatColor(color)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${
                        newCatColor === color ? 'border-slate-900 scale-110 shadow-xs' : 'border-slate-100'
                      }`}
                      style={{ backgroundColor: color === 'blue' ? '#3b82f6' : color === 'emerald' ? '#10b981' : color === 'amber' ? '#f59e0b' : color === 'violet' ? '#8b5cf6' : color === 'rose' ? '#f43f5e' : color === 'indigo' ? '#6366f1' : '#64748b' }}
                    >
                      {newCatColor === color && <Check size={12} className="text-white font-bold" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon choices */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Icône</label>
                <div className="flex gap-3">
                  {ICON_CHOICES.map(iconStr => {
                    const isSelected = newCatIcon === iconStr;
                    return (
                      <button
                        key={iconStr}
                        type="button"
                        onClick={() => setNewCatIcon(iconStr)}
                        className={`p-2.5 rounded-lg border transition ${
                          isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {renderCategoryIcon(iconStr, 16)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit btn */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs leading-loose transition"
              >
                Créer la catégorie
              </button>
            </form>
          </div>

          {/* Categories lists display and details */}
          <div className="lg:col-span-7 bg-white border border-slate-100 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Dossiers de Catégories</h3>
              <p className="text-[11px] text-slate-400">Liste des étiquettes disponibles pour tes shifts et documents</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="categories-loop-grid">
              {categories.map(cat => {
                const colorClasses = getTailwindBgColor(cat.color);
                
                // Count dependencies
                const relatedEvents = events.filter(e => e.category === cat.id);
                const relatedNotes = notes.filter(n => n.categoryId === cat.id);

                return (
                  <div key={cat.id} className="p-3.5 bg-slate-55 border border-slate-150/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg border ${colorClasses}`}>
                        {renderCategoryIcon(cat.icon, 16)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{cat.name}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {relatedEvents.length} événements • {relatedNotes.length} notes
                        </p>
                      </div>
                    </div>

                    {/* Allow deleting categories other than Glace unless they are custom-added */}
                    <button
                      type="button"
                      disabled={relatedEvents.length > 0 || relatedNotes.length > 0}
                      onClick={() => {
                        if (confirm(`Voulez-vous supprimer la catégorie "${cat.name}" ?`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className={`p-1.5 text-slate-400 rounded-md transition ${
                        relatedEvents.length > 0 || relatedNotes.length > 0 
                          ? 'opacity-30 cursor-not-allowed hover:bg-transparent' 
                          : 'hover:text-rose-600 hover:bg-rose-50'
                      }`}
                      title={relatedEvents.length > 0 || relatedNotes.length > 0 ? "Utilisée par des événements ou des notes" : "Supprimer la catégorie"}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
