import React, {FC} from 'react';
import 'react-native-get-random-values';
// import {LogBox, Platform} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator, StackNavigationProp} from "@react-navigation/stack";

import Home from "./Home";
import Collection from "./Collection";
import UserSettings from "./UserSettings";
import GameNight from "./GameNights";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

export interface NavProp {
  navigation: StackNavigationProp<any, any>;
}

const App: FC = () => {
  /*if (Platform.OS !== "web") {
    LogBox.ignoreLogs(['Setting a timer']);
  }*/

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Start" component={Home}/>
        <Stack.Screen name="Collection" component={Collection}/>
        <Stack.Screen name="Settings" component={UserSettings}/>
        <Stack.Screen name="Game Night" component={GameNight}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
