'use client';

import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

export default function ThemeToggle() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  const currentThemeData = themes.find(t => t.value === theme) || themes[2];
  const CurrentIcon = currentThemeData.icon;

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
          ${actualTheme === 'dark' 
            ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700' 
            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm'
          }
        `}
      >
        <CurrentIcon className="w-4 h-4" />
        <span className="hidden sm:inline">{currentThemeData.label}</span>
      </motion.button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className={`
              absolute right-0 top-full mt-2 w-40 rounded-lg shadow-lg border z-20
              ${actualTheme === 'dark'
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="py-1">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon;
                const isSelected = theme === themeOption.value;
                
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => {
                      setTheme(themeOption.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors
                      ${actualTheme === 'dark'
                        ? isSelected
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-200 hover:bg-gray-700'
                        : isSelected
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{themeOption.label}</span>
                    {isSelected && (
                      <motion.div
                        layoutId="selected-theme"
                        className={`
                          ml-auto w-2 h-2 rounded-full
                          ${actualTheme === 'dark' ? 'bg-white' : 'bg-blue-600'}
                        `}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}