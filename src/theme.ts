import { Category } from './types';

export const colors = {
  bg: '#FFF9F2',
  card: '#FFFFFF',
  text: '#2D2A32',
  muted: '#8A8494',
  border: '#EFE6DA',
  primary: '#6C5CE7',
  primarySoft: '#ECE9FF',
  success: '#2EAD6B',
  successSoft: '#E3F6EC',
  warning: '#E8833A',
  warningSoft: '#FDEEE2',
  danger: '#D64545',
};

export const categoryColors: Record<Category, string> = {
  meal: '#F4A261',
  sleep: '#7B8CDE',
  hygiene: '#4FB8C9',
  meds: '#E76F8C',
  activity: '#6BBF59',
};

export const categoryLabels: Record<Category, string> = {
  meal: 'Meal',
  sleep: 'Sleep',
  hygiene: 'Hygiene',
  meds: 'Meds',
  activity: 'Activity',
};
