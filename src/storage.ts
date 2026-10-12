import AsyncStorage from '@react-native-async-storage/async-storage';
import { DayPlan, Routine } from './types';

const ROUTINES_KEY = 'toddler-reminder/routines/v1';
const PLAN_KEY = 'toddler-reminder/plan/v1';

async function read<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch (e) {
    console.warn(`Failed to read ${key}`, e);
    return null;
  }
}

async function write(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to write ${key}`, e);
  }
}

export const loadRoutines = () => read<Routine[]>(ROUTINES_KEY);
export const saveRoutines = (r: Routine[]) => write(ROUTINES_KEY, r);
export const loadPlan = () => read<DayPlan>(PLAN_KEY);
export const savePlan = (p: DayPlan) => write(PLAN_KEY, p);
