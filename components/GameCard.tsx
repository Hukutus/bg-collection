import React, {FC} from "react";
import {View, Text, Image, StyleSheet, Dimensions, ScrollView} from "react-native";
import {BoardGame} from "./BGGApi";
import BGLabel from "./BGLabel";


export type GameCardType = {
  game?: BoardGame;
}

const GameCard: FC<GameCardType> = (props: GameCardType) => {
  return (
    <View style={[styles.view, styles.shadow]}>
      <Image
        source={{uri: props.game?.thumbnail}}
        style={styles.image}
      />

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
    </View>
  );
};

export default GameCard;

const styles = StyleSheet.create({
  view: {
    height: 170,
    backgroundColor: "darkgray",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 6,
  },
  infoBox: {
    flex: 1,
    marginLeft: 10,
    color: "white"
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
    width: 120,
    height: 150,
    borderRadius: 3,
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
