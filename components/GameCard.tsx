import React, {FC} from "react";
import {View, Text, Image, StyleSheet, Dimensions, ScrollView} from "react-native";
import {BoardGame} from "../lib/BGGApi";
import BGLabel from "./BGLabel";


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
            backgroundColor: 'transparent'
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

const GameCard: FC<GameCardType> = (props: GameCardType) => {
  const size: number = Dimensions.get("window").width - 40;

  return (
    <View style={[styles.view, styles.shadow]}>
      {/*<Image
        source={{uri: props.game?.image}}
        style={[
          styles.image,
          {
            width: size,
            height: size,
          }
        ]}
      />*/}

      <CroppedImage
        source={{uri: props.game?.image}}
        cropTop={0}
        cropLeft={0}
        cropWidth={size}
        cropHeight={size}
        width={size}
        height={size}
      />

      <View style={[styles.flexRow]}>
        <Text style={styles.title}>{props.game?.name}</Text>

        <View style={styles.labelRow}>
          <BGLabel label={"Best: " + props.game?.bestplayers + "p"}/>
          <BGLabel label={props.game?.minplayers + "-" + props.game?.maxplayers + "p"}/>
          <BGLabel label={props.game?.playingtime + "min"}/>
        </View>
      </View>

      <Text>Owned by: {props?.game?.ownedBy}</Text>

      {
        props.extended &&
        <View style={styles.infoBox}>
          <Text style={styles.title}>{props.game?.name}</Text>

          <ScrollView style={styles.scrollView}>
            <Text style={styles.text}>{props.game?.description}</Text>
          </ScrollView>

          <View style={styles.labelRow}>
            <BGLabel label={"Best: " + props.game?.bestplayers + "p"}/>
            <BGLabel label={props.game?.minplayers + "-" + props.game?.maxplayers + "p"}/>
            <BGLabel label={props.game?.playingtime + "min"}/>
          </View>
        </View>
      }
    </View>
  );
};

export default GameCard;

const styles = StyleSheet.create({
  view: {
    backgroundColor: "darkgray",
    flexDirection: "column",
    justifyContent: "space-between",
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
