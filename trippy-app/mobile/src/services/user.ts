import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

const USER_ID_KEY = '@trippy_user_id';

let cachedUserId: string | null = null;

// There is no authentication yet, so each device gets a stable random id the
// first time it's needed and reuses it afterwards.
export async function getUserId(): Promise<string> {
  if (cachedUserId) {
    return cachedUserId;
  }

  const stored = await AsyncStorage.getItem(USER_ID_KEY);
  if (stored) {
    cachedUserId = stored;
    return stored;
  }

  const newId = uuid.v4() as string;
  await AsyncStorage.setItem(USER_ID_KEY, newId);
  cachedUserId = newId;
  return newId;
}
