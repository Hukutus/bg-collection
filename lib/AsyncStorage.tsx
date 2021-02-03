import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserType = {
  bggName: string;
  alias?: string;
};

export const storeData = async (key: string, value: any): Promise<boolean> => {
  try {
    const jsonValue: string = JSON.stringify(value);

    await AsyncStorage.setItem(key, jsonValue);

    return true;
  } catch (e) {
    // saving error
    return false;
  }
};

export const getUser = async (): Promise<UserType | null> => {
  try {
    const jsonValue = await AsyncStorage.getItem("@user");
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch(e) {
    // error reading value
    return null;
  }
};

export const getData = async (key: string): Promise<string | null | UserType> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch(e) {
    // error reading value
    return null;
  }
};

export const createUUID = (): void => {

};
