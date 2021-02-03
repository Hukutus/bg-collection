import React, {FC, useEffect, useState} from "react";
import { format } from "date-fns";
import {Button, FlatList, SafeAreaView, StyleSheet, Text, TextInput, View} from "react-native";
import {getUser, storeData, UserType} from "../lib/AsyncStorage";
import {publicStyles} from "../lib/Styles";
import _ from "lodash";
import {fetchCollection, getCollection, getGameNight} from "../lib/GameFunctions";
import {BoardGameCollectionInfo} from "../lib/BGGApi";
import { v4 as uuid } from 'uuid';
import {firebase} from "../lib/Firebase";
import UserCard from "../components/UserCard";
const db = firebase.firestore();
import DateTimePicker from '@react-native-community/datetimepicker';
import {bggUsers} from "../config";

export type GameNightType = {
  id: string;

  date: Date;
  players: string[]; // list of BGG usernames

  location?: string;
  description?: string;

  votes: {
    id: string;
    count: number;
  }[];
};

const getNewGameNight = (): GameNightType => {
  return {
    id: uuid(),

    date: new Date(),
    players: [],

    location: "",
    description: "",

    votes: []
  };
};

const GameNight: FC<any> = ({route, navigation, gameNightId}) => {
  const [gameNight, setGameNight] = useState<GameNightType>();
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    getGameNight(gameNightId)
      .then((gameNight) => {
        setGameNight(gameNight ?? getNewGameNight());
      });
  }, [gameNightId]);

  useEffect(() => {
    console.log("SHOW DATE PICKER DAMNIT!", showDatePicker);
  }, [showDatePicker]);

  const setValue = (key: keyof GameNightType, value: string | Date): void => {
    console.log("Set value", key, value);
    const gameNightChanges: GameNightType = gameNight ? _.clone(gameNight) : getNewGameNight();

    // @ts-ignore
    gameNightChanges[key] = value;

    setGameNight(gameNightChanges);
  };

  const toggleDatePicker = (value: boolean): void => {
    setShowDatePicker(value);
  };

  const saveChanges = (): void => {
    if (!gameNight) {
      return;
    }

    db
      .collection("GameNights")
      .doc(gameNight.id)
      .set(gameNight, {merge: true})
      .then(() => true);
  };

  return (
    <SafeAreaView>
      <Text style={publicStyles.header}>
        Let's make a game night
      </Text>

      <Text>
        When are you playing?
      </Text>

      <Button
        title={"Toggle date picker"}
        onPress={() => toggleDatePicker(!showDatePicker)}
      />

      <View>
        {
          showDatePicker ?
          <DateTimePicker
            value={gameNight?.date ?? new Date(new Date().setHours(0, 0, 0, 0))}
            onChange={(date: any) => setValue("date", new Date(date.nativeEvent.timestamp))}
          /> : <Text>Not visible</Text>
        }
      </View>

      <Text>
        Where?
      </Text>

      <TextInput
        onChangeText={(text: string) => setValue("location", text)}
        value={gameNight?.location ?? ""}
      />

      <Text>
        Add a description (optional)
      </Text>

      <TextInput
        onChangeText={(text: string) => setValue("description", text)}
        value={gameNight?.description ?? ""}
      />

      <Text>
        Who's playing?
      </Text>

      <UserCard
        bggName={bggUsers[0].name}
        alias={bggUsers[0].alias}
      />

      {/*<FlatList
        data={this.props.puppies}
        renderItem={({item}) => this.renderRow(item)}
        keyExtractor={(item, index) => item.id}
        initialNumToRender={8}
      />*/}

      <Button
        title={"Save changes"}
        onPress={() => saveChanges()}
      />
    </SafeAreaView>
  );
};

export default GameNight;

const styles = StyleSheet.create({

});
