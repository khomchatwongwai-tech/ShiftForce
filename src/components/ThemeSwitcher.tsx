import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Eye, Check, Sparkles, Sliders } from 'lucide-react';
import { useTheme, ThemeMode } from '../context/ThemeContext';

interface ThemeSwitcherProps {
  variant?: 'compact' | 'dropdown' | 'inline' | 'mobile';
  className?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  variant = 'dropdown',
  className = '',
}) => {
  const {
    theme,
    isDark,
    highContrast,
    setTheme,
    toggleTheme,
    toggleHighContrast,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Inline / Mobile list layout
  if (variant === 'inline' || variant === 'mobile') {
    return (
      <div className={`space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            {isDark ? <Moon className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            <span>Theme & Shift Display</span>
          </label>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {isDark ? (highContrast ? 'Night High-Contrast' : 'Dark Mode') : 'Light Mode'}
          </span>
        </div>

        {/* 3-Way Selector */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500 fill-amber-500/20' : ''}`} />
            <span>Light</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-sky-300 fill-sky-300/20' : ''}`} />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs border border-slate-200/80 dark:border-slate-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>System</span>
          </button>
        </div>

        {/* High-Contrast Toggle */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Eye className={`w-4 h-4 ${highContrast ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                Late-Night Eye Comfort
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                High-contrast borders & anti-glare for night shifts
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleHighContrast}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              highContrast ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
            role="switch"
            aria-checked={highContrast}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                highContrast ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  // Compact direct toggle (Icon only)
  if (variant === 'compact') {
    return (
      <button
        id="theme-quick-toggle-btn"
        type="button"
        onClick={toggleTheme}
        className={`p-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 text-sky-300 border-slate-700 hover:border-sky-500/50'
            : 'bg-slate-100 hover:bg-slate-200/80 text-amber-600 border-slate-300 hover:border-amber-400/50'
        } ${className}`}
        title={isDark ? 'Switch to Light Mode' : 'Switch to High-Contrast Night Shift Mode'}
        aria-label="Toggle Theme"
      >
        {isDark ? (
          <Moon className="w-4 h-4 text-sky-400 fill-sky-400/20" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
        )}
      </button>
    );
  }

  // Dropdown variant (Default for Navbar header)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        id="navbar-theme-menu-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
          isDark
            ? 'bg-slate-900 hover:bg-slate-800 text-sky-300 border-slate-700 hover:border-sky-500/50 shadow-sky-950/40'
            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-800 border-slate-300 shadow-slate-200/60'
        }`}
        title={isDark ? 'Night Shift Mode Active (Click for theme options)' : 'Light Mode (Click for Night Shift Dark Mode)'}
        aria-label="Theme settings"
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
        )}
        <span className="font-bold hidden sm:inline-block">
          {theme === 'system' ? 'System' : isDark ? 'Night' : 'Light'}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2.5 z-50 animate-in fade-in zoom-in-95 text-xs">
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <h4 className="font-bold text-slate-900 dark:text-white">Display &amp; Theme</h4>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Shift Comfort
            </span>
          </div>

          {/* Preset Buttons */}
          <div className="p-2 space-y-1">
            <button
              type="button"
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                theme === 'light'
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800/80'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                  <Sun className="w-4 h-4 fill-amber-500/20" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-900 dark:text-white">Daylight Mode</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Crisp high-contrast light theme for day shifts</span>
                </div>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-amber-600 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-950 dark:text-sky-200 font-bold border border-sky-200 dark:border-sky-800/80'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-sky-400 border border-slate-700 flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4 fill-sky-400/20" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="block font-bold text-xs text-slate-900 dark:text-white">Late-Night Shift Mode</span>
                    <span className="bg-sky-600 text-white text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase">
                      Eye-Safe
                    </span>
                  </div>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Deep midnight slate with anti-glare protection</span>
                </div>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition-colors cursor-pointer ${
                theme === 'system'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold border border-slate-200 dark:border-slate-700'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold text-xs text-slate-900 dark:text-white">Match Device OS</span>
                  <span className="block text-[10px] text-slate-500 dark:text-slate-400">Automatically switch with system schedule</span>
                </div>
              </div>
              {theme === 'system' && <Check className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />}
            </button>
          </div>

          {/* High Contrast Setting for Dimly-Lit Kitchen / Manager Office */}
          <div className="p-3 mx-2 mt-1 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className={`w-4 h-4 ${highContrast ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400'}`} />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs">
                  Night Shift Contrast
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Sharper borders for back-office monitors
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={toggleHighContrast}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                highContrast ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              role="switch"
              aria-checked={highContrast}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  highContrast ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
