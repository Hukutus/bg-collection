import React, {FC} from "react";
import {View, Text, Image, StyleSheet, Dimensions, ScrollView} from "react-native";
import {BoardGame} from "../lib/BGGApi";
import BGLabel from "./BGLabel";
import {UserType} from "../lib/AsyncStorage";


export type GameCardType = {
  game?: BoardGame;
  extended?: boolean;
}

const CroppedImage: FC<any> = (props: any) => {
  return (
    <View
      style={[
        {
          overflow: 'hidden',
          height: props.cropHeight,
          width: props.cropWidth,
          backgroundColor: 'transparent',
          borderRadius: 50
        },
        props.style
      ]}
    >
      <Image
        style={{
          position: 'absolute',
          top: props.cropTop * -1,
          left: props.cropLeft * -1,
          width: props.width,
          height: props.height
        }}
        source={props.source}
        resizeMode={props.resizeMode}
      >
        {props.children}
      </Image>
    </View>
  );
};

const UserCard: FC<UserType> = (props: UserType) => {
  const size: number = 40;

  return (
    <View style={[styles.view, styles.shadow]}>
      {/*<CroppedImage
        source={"./icon.png"}
        cropTop={0}
        cropLeft={0}
        cropWidth={size}
        cropHeight={size}
        width={size}
        height={size}
      />*/}

      <Text style={styles.title}>
        {props.bggName + " (" + props.alias + ")"}
      </Text>
    </View>
  );
};

export default UserCard;

const styles = StyleSheet.create({
  view: {
    backgroundColor: "darkgray",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  infoBox: {
    flex: 1,
    marginLeft: 10,
    color: "white"
  },
  flexRow: {
    flexDirection: "column"
  },
  scrollView: {
    height: 65,
    marginBottom: 5,
  },
  title: {
    color: "white",
    fontSize: 24,
    marginBottom: 4,
  },
  text: {
    color: "white"
  },
  image: {
    borderRadius: 3,
    position: "absolute",
    top: 0
  },
  shadow: {
    shadowColor: "black",
    shadowOffset: {
      width: 1,
      height: 2,
    },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  labelRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "flex-end"
  }
});
