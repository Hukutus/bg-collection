import React, {FC} from "react";
import {StyleSheet, View, Text} from "react-native";

const BGLabel: FC<{label: string}> = (props: {label: string}) => {
  return (
    <View style={styles.label}>
      <Text style={styles.text}>
        {props?.label}
      </Text>
    </View>
  )
};

export default BGLabel;

const styles = StyleSheet.create({
  label: {
    height: 20,
    width: 75,
    marginRight: 5,
    marginBottom: 5,
    paddingLeft: 5,
    paddingRight: 5,
    backgroundColor: "darkorange",
    borderRadius: 5,

    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 0,
    elevation: 2,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 14,
  }
});
