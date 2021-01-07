import React, {FC} from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {BoardGameCollectionInfo} from "./BGGApi";

export type UserToggleType = {
  collection: BoardGameCollectionInfo;
  selected: boolean;
  i: number;
  onPress: () => void;
}

const getUnknownPlayerName = (i: number): string => {
  if (!i) {
    return "1st Player";
  }

  if (i === 1) {
    return "2nd Player";
  }

  if (i === 2) {
    return "3rd Player";
  }

  return (i + 1) + "th Player";
};

const UserToggle: FC<UserToggleType> = ({collection, selected, i, onPress}) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <View style={[styles.container, selected ? styles.selected : {}]}>
        <Text style={styles.text}>
          {collection.user ? collection.user : getUnknownPlayerName(i)}
        </Text>
      </View>
    </TouchableOpacity>
  )
};

export default UserToggle;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "darkgray",
    borderRadius: 20,
    padding: 10,
    margin: 5,
  },
  selected: {
    backgroundColor: "green",
  },
  text: {
    color: "white",
    fontSize: 20,
  }
});
