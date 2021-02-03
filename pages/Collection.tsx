import React, {FC, useEffect, useState} from "react";
import {Button, FlatList, SafeAreaView, StyleSheet, Text, View} from "react-native";
import GameCard from "../components/GameCard";
import {BoardGameCollectionInfo, getGamesForGroup} from "../lib/GameFunctions";
import {BoardGame} from "../lib/BGGApi";

const Collection: FC<any> = ({route, navigation}) => {
  const [collections, setCollections] = useState<BoardGameCollectionInfo[]>([]);
  const [bestGames, setBestGames] = useState<BoardGame[]>([]);

  useEffect(() => {
    setCollections(route.params.collections);
  }, []);

  useEffect(() => {
    getGamesForGroup(collections)
      .then((games: BoardGame[]) => {
        setBestGames(games);
      });
  }, [collections]);

  return (
    <SafeAreaView>
      <Text style={styles.playerCount}>
        {collections ? `Best with ${collections?.length} players` : `No filter selected`}
      </Text>

      <FlatList
        data={bestGames}
        renderItem={({item, index, separators}) => (
          <GameCard
            game={item}
          />
        )}
        keyExtractor={item => item.id}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

export default Collection;

const styles = StyleSheet.create({
  gamesList: {
    flex: 1,
  },
  playerCount: {
    fontSize: 30,
    marginTop: 5,
    marginBottom: 2,
  }
});
