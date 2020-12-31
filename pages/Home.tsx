import {StyleSheet, Text, TextInput, View} from "react-native";
import React, {FC, useState} from "react";
import BGGApi from "../components/BGGApi";

import { firebase } from '../components/Firebase';
const db = firebase.firestore();

/*const getUsers = async (): Promise<void> => {
  console.log("Get users!");

  const snapshot = await db
    .collection("collections")
    .get();

  snapshot.forEach((doc) => {
    console.log("Data?", doc.data());
  });
};*/

const Home: FC = () => {
  const [playerCount, playerCountChange] = useState<string>();

  return (
    <View style={styles.view}>
      <View style={styles.countSelector}>
        <Text
          style={styles.text}
        >
          How many players?
        </Text>

        <TextInput
          style={[styles.text, styles.textInput]}
          keyboardType={"numeric"}
          onChangeText={(text: string) => playerCountChange(text)}
          value={playerCount}
        />
      </View>

      <BGGApi
        playerCount={playerCount}
      />
    </View>
  );
};

export default Home;

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexGrow: 1,
    margin: 10,
  },
  countSelector: {
    flexDirection: "row",
    margin: 10,
    width: "100%",
    height: 30
  },
  text: {
    height: 30,
    fontSize: 20,
    margin: 5,
    flexGrow: 1
  },
  textInput: {
    fontWeight: "bold",
    flexGrow: 1
  }
});
