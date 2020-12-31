// @generated: @expo/next-adapter@2.1.52
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Home from "./Home";

export default function App() {
  return (
    <View style={styles.container}>
      <Home />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
});
