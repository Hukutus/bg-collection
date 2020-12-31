// @generated: @expo/next-adapter@2.1.52
import React from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import Home from "./Home";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#2EBD6B" barStyle="light-content" />

      <Home />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "lightgray",
  }
});
