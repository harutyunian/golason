"use client";

import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';
import styles from './DateSelector.module.css';

export interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD format
  onDateChange: (date: string) => void;
}

// Date parser that prevents timezone drift by parsing YYYY-MM-DD locally
const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Formatter to YYYY-MM-DD
const formatLocalDate = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function DateSelector({ selectedDate, onDateChange }: DateSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Validate formatting of selectedDate
  const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(selectedDate);
  const activeDate = isValidDate ? parseLocalDate(selectedDate) : new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const offset = i - 3; // Selected is at index 3 (centered)
    const date = new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate() + offset);
    const formatted = formatLocalDate(date);

    // Format weekday and number
    const today = new Date();
    const isToday = date.getFullYear() === today.getFullYear() &&
                    date.getMonth() === today.getMonth() &&
                    date.getDate() === today.getDate();

    const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const weekdayName = isToday ? 'TODAY' : DAYS[date.getDay()];
    const dayNum = String(date.getDate()).padStart(2, '0');

    // For better accessibility, friendly date label
    const ariaLabel = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return {
      formatted,
      weekday: weekdayName,
      dayNum,
      isActive: formatted === selectedDate,
      ariaLabel,
    };
  });

  const handleKeyDown = (e: React.KeyboardEvent, formattedDate: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onDateChange(formattedDate);
    }
  };

  return (
    <div className={styles.container} aria-label="Date selection carousel">
      {/* Scrollable Ribbon */}
      <div 
        className={styles.ribbon} 
        ref={containerRef}
        role="tablist"
        aria-label="Horizontal dates selection"
      >
        {days.map((day) => (
          <div
            key={day.formatted}
            className={`${styles.dayCard} ${day.isActive ? styles.active : ''}`}
            onClick={() => onDateChange(day.formatted)}
            onKeyDown={(e) => handleKeyDown(e, day.formatted)}
            tabIndex={0}
            role="tab"
            aria-selected={day.isActive}
            aria-label={`${day.isActive ? 'Selected date: ' : ''}${day.ariaLabel}`}
          >
            <span className={styles.weekday}>{day.weekday}</span>
            <span className={styles.dayNum}>{day.dayNum}</span>
          </div>
        ))}
      </div>

      {/* Vertical divider */}
      <div className={styles.divider} aria-hidden="true" />

      {/* Calendar Button Wrapper with transparent native date picker */}
      <div 
        className={styles.calendarWrapper}
        role="button"
        tabIndex={0}
        aria-label="Open calendar date picker"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            // Focus on hidden input and trigger picker
            const input = e.currentTarget.querySelector('input');
            if (input) {
              if (typeof input.showPicker === 'function') {
                input.showPicker();
              } else {
                input.focus();
                input.click();
              }
            }
          }
        }}
      >
        <Calendar size={20} className={styles.calendarIcon} />
        <input
          type="date"
          className={styles.dateInput}
          value={selectedDate}
          onChange={(e) => {
            if (e.target.value) {
              onDateChange(e.target.value);
            }
          }}
          aria-label="Select date from calendar picker"
        />
      </div>
    </div>
  );
}
