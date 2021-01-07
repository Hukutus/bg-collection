import React, {FC, useEffect, useState} from "react";
import _ from "lodash";

import {decode} from 'html-entities';
import Swiper from "react-native-deck-swiper";

import GameCard from "./GameCard";
import {StyleSheet, View, Text, ScrollView, FlatList, SafeAreaView, Button} from "react-native";

const parseString = require('react-native-xml2js').parseString;

import {firebase} from '../components/Firebase';

const db = firebase.firestore();

const bgUsers: string[] = ["Domonation", "m0rlo"];

export interface BGGPlayerData {
  min: number;
  max: number;
  best: number;
  recommended: number[];
}

export interface BoardGameLink {
  id: number;
  value: string;
}

export interface PlayerVotes {
  numplayers: string;
  best: number;
  recommended: number;
  notrecommended: number;
}

// Stored in db, games only include name and id
export interface BoardGameCollectionInfo {
  user: string;
  size: number;

  games: BoardGameInfo[];
  updatedAt?: Date;
}

export interface GamesByPlayerCount {
  bestplayers: string;
  games: BoardGame[];
}

export interface BoardGameInfo {
  id: string;
  name?: string;
}

export interface BoardGame {
  id: string;
  name: string;

  type?: string;
  alternateNames?: string[];
  description?: string;
  yearpublished?: string;
  image?: string;
  thumbnail?: string;
  minage?: string;

  // Minutes
  playingtime?: string;
  minplaytime?: string;
  maxplaytime?: string;

  maxplayers?: string;
  minplayers?: string;

  playervotes?: PlayerVotes[];
  bestplayers?: string; // Parsed from votes

  ownedBy?: string[]; // User names
  updatedAt?: Date;

  // TODO
  links?: {
    categories?: BoardGameLink[]; // "boardgamecategory"
    mechanics?: BoardGameLink[]; // "boardgamemechanic"
    families?: BoardGameLink[]; // "boardgamefamily"
    expansions?: BoardGameLink[]; // "boardgameexpansion"
    compilations?: BoardGameLink[]; // ?? "boardgamecompilation"
    implementations?: BoardGameLink[]; // "boardgameimplementation"
    artists?: BoardGameLink[]; // "boardgameartist"
    publishers?: BoardGameLink[]; // "boardgamepublisher"
  }
}

const apiPath: string = "https://www.boardgamegeek.com/xmlapi2/";

/*const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};*/

const parseCollectionJson = (resultObject: Record<string, any>[], userName: string): BoardGameCollectionInfo | null => {
  if (!resultObject) {
    return null;
  }

  return {
    user: userName,
    size: resultObject.length,
    games: resultObject.map(item => {
      return {
        id: item.$.objectid,
        name: item.name[0]._
      }
    })
  };
};

const parseBoardGameFromGeneratedJson = (resultObject: Record<string, any>): BoardGame => {
  const stringArrays: string[] = ["description", "image", "thumbnail"];
  const numberStringArrays: string[] = ["maxplayers", "maxplaytime", "minage", "minplayers", "minplaytime", "playingtime", "yearpublished"];

  let parsedBoardGame: BoardGame = {
    id: "-1",
    name: "Unknown"
  };

  for (const key of Object.keys(resultObject)) {
    if (key === "$") {
      // Get ID (just in case)
      parsedBoardGame.id = resultObject[key].id;
    } else if (key === "name") {
      // Parse primary name and alternate names
      parsedBoardGame.name = resultObject[key][0].$.value;
      parsedBoardGame.alternateNames = resultObject[key].map((item: Record<string, any>) => item.$.value);
    } else if (key === "link") {
      // Parse categories and mechanics, etc.
      // TODO Not needed right now
    } else if (key === "poll") {
      // Parse best players
      if (resultObject[key]) {
        parsedBoardGame.playervotes = resultObject[key][0].results
          .map((item: Record<string, any>) => {
            return {
              numplayers: item.$.numplayers,
              best: item.result?.length ? item.result[0].$.numvotes : -1,
              recommended: item.result?.length ? item.result[1].$.numvotes : -1,
              notrecommended: item.result?.length ? item.result[2].$.numvotes : -1,
            }
          }).sort((a: PlayerVotes, b: PlayerVotes) => {
            return b.best - a.best;
          });
      }

      parsedBoardGame.bestplayers = parsedBoardGame.playervotes ? parsedBoardGame.playervotes[0].numplayers : "Unknown";
      // TODO also parse "language_dependence" and "suggested_playerage"
    } else if (stringArrays.indexOf(key) !== -1) {
      // Value is inside a one-length array
      parsedBoardGame[key as keyof BoardGame] = key === "description" ? decode(resultObject[key][0]) : resultObject[key][0];
    } else if (numberStringArrays.indexOf(key) !== -1) {
      // Value is inside a one-length array inside key $
      parsedBoardGame[key as keyof BoardGame] = resultObject[key][0].$.value;
    } else {
      console.warn("Unknown key", key);
    }
  }

  return parsedBoardGame;
};

export interface ApiProps {
  playerCount: string;
}

const BGGApi: FC<ApiProps> = (props: ApiProps) => {
  const [collection, setCollection] = useState<BoardGameCollectionInfo | null>();
  const [gamesList, setGamesList] = useState<BoardGame[]>([]);
  const [filteredGamesList, setFilteredGamesList] = useState<BoardGame[]>([]);
  const [playerCount, setPlayerCount] = useState<string>();

  useEffect(() => {
    if (props.playerCount !== playerCount) {
      setPlayerCount(props.playerCount);

      if (gamesList?.length) {
        setFilteredGamesList(gamesList.filter((item: BoardGame) => props.playerCount ? item.bestplayers === props.playerCount : true))
      }
    }
  }, [props.playerCount]);

  useEffect(() => {
    if (gamesList?.length) {
      setFilteredGamesList(gamesList.filter((item: BoardGame) => playerCount ? item.bestplayers === playerCount : true))
    }
  }, [gamesList]);

  const setGame = async (gameId: string | undefined, changes: BoardGame): Promise<void> => {
    if (!gameId || !changes) {
      console.warn("No game or changes to set", gameId, changes);
      return;
    }

    // Check if game exists in db
    const gameDoc: BoardGame | null = await db
      .collection("BoardGame")
      .where("id", "==", gameId)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          return null;
        }

        return snapshot?.docs?.length ? snapshot?.docs[0]?.data() as BoardGame : null;
      });

    let changeDetected: boolean = false;

    if (gameDoc) {
      // Found game in db
      if (_.isEqual(gameDoc, changes)) {
        // No changes
        return;
      } else {
        // Update each key
        for (const key of Object.keys(changes)) {
          if (_.isEqual(gameDoc[key as keyof BoardGame], changes[key as keyof BoardGame])) {
            // Value not changed
            continue;
          }

          gameDoc[key as keyof BoardGame] = changes[key as keyof BoardGame] as any;
          changeDetected = true;
        }
      }
    } else {
      // New entry
      changeDetected = true;
    }

    if (!changeDetected) {
      // Not changes
      return;
    }

    await db
      .collection("BoardGame")
      .doc(gameId)
      .set(gameDoc || changes, {merge: true});

    console.log("Saved game to database", gameId, gameDoc || changes);
  };

  // gameIds separated by commas
  const fetchGames = async (games: BoardGameInfo[], user: string): Promise<BoardGame[]> => {
    const commaSeparatedGameIds: string = games.map(item => item.id).join(",");

    // Fetch games from BGG API
    return await fetch(apiPath + "thing?id=" + commaSeparatedGameIds)
      .then((res: Response) => {
        return res.text();
      })
      .then((xmlString: string) => {
        return new Promise((resolve, reject) => parseString(xmlString, (err: string, result: Record<string, any>) => {
          if (err) {
            console.warn("Error with XML parse", err);
            return reject(err);
          }

          const data = result?.items?.item?.length ? result.items.item : null;

          if (!data) {
            console.warn("Invalid data from XML parse", result);
            return reject("Invalid data");
          }

          resolve(data);
        })) as Promise<any[]>;
      })
      .then((result: any[]) => {
        const fetchedGames: BoardGame[] = result.map(item => parseBoardGameFromGeneratedJson(item));

        // Save changes to DB
        for (const game of fetchedGames) {
          game.ownedBy = game.ownedBy ? game.ownedBy.concat(user) : [user];
          setGame(game.id, game);
        }

        return fetchedGames;
      })
      .catch(err => {
        console.error("Failed getting game info", err);
        return [];
      });
  };

  const getGames = async (games: BoardGameInfo[]): Promise<BoardGame[]> => {
    const gameIds: string[] = games.map(item => item.id);

    const promises: Promise<BoardGame[]>[] = [];

    // Firestore only allows fetching in with at most 10 elements, so split request into chunks
    for (const chunk of _.chunk(gameIds, 10)) {
      promises.push(
        db
          .collection("BoardGame")
          .where("id", "in", chunk)
          .get()
          .then(snapshot => {
            if (snapshot.empty || !snapshot?.docs?.length) {
              return [];
            }

            return snapshot.docs.map(item => item.data() as BoardGame);
          })
      );
    }

    // Wait for all promises, and concat arrays to one
    return await Promise.all(promises)
      .then((results: BoardGame[][]) => {
        const temp: BoardGame[] = [];
        return temp.concat.apply([], results);
      });
  };

  // Add games and gamesByPlayerCount to BoardGameCollectionInfo
  const getCollectionGames = async (collectionInfo: BoardGameCollectionInfo): Promise<void> => {
    const dbGames: BoardGame[] = await getGames(collectionInfo.games);

    // Check if all games were in DB, so no need to get games from BGG API
    if (dbGames.length === collectionInfo.games.length) {
      setGamesList(dbGames);
      return;
    }

    // Get games from BGG API
    // Also saves them to DB
    const fetchedGames: BoardGame[] = await fetchGames(collectionInfo.games, collectionInfo.user);
    setGamesList(fetchedGames);
  };

  const getCollection = async (userName: string): Promise<void> => {
    const gameCollectionInfo: BoardGameCollectionInfo | null = await db
      .collection("GameCollections")
      .where("user", "==", userName)
      .get()
      .then(snapshot => {
        if (snapshot.empty) {
          console.warn("Snapshot was empty", userName);
          return null;
        }

        return snapshot?.docs?.length ? snapshot?.docs[0]?.data() as BoardGameCollectionInfo : null;
      });

    if (gameCollectionInfo) {
      setCollection(gameCollectionInfo);
      await getCollectionGames(gameCollectionInfo);
      return;
    }

    console.log("Collection doesn't exist, get from BGG API", userName);

    // Collection not in DB, fetch from BGG API
    await fetch(apiPath + "collection?username=" + userName + "&own=1")
      .then((res: Response) => {
        return res.text();
      })
      .then((xmlString: string) => {
        return new Promise((resolve, reject) => parseString(xmlString, (err: string, result: Record<string, any>) => {
          if (err) {
            console.warn("Error with XML parse", err);
            return reject(err);
          }

          const data = result?.items?.item?.length ? result.items.item : null;

          if (!data) {
            console.warn("Invalid data from XML parse", result);
            return reject("Invalid data");
          }

          resolve(data);
        })) as Promise<Record<string, any>[]>;
      })
      .then((result: Record<string, any>[]) => {
        const parsedCollectionInfo: BoardGameCollectionInfo | null = parseCollectionJson(result, userName);

        if (parsedCollectionInfo) {
          parsedCollectionInfo.updatedAt = new Date();

          console.log("Got collection info from BGG API", parsedCollectionInfo);

          db
            .collection("GameCollections")
            .doc()
            .set(parsedCollectionInfo);

          setCollection(parsedCollectionInfo);
          getCollectionGames(parsedCollectionInfo);

          return;
        }

        setCollection(null);
      })
      .catch(err => {
        console.error("Failed getting collection", userName, err);
        setCollection(null);
      });
  };

  useEffect(() => {
    if (!collection) {
      (async function fetchCollectionAsync() {
        await getCollection("Domonation");
      })();
    }
  }, []);

  return (
    <SafeAreaView>
      <Text style={styles.playerCount}>
        {playerCount ? `Best with ${playerCount} players` : `No filter selected`}
      </Text>

      {/*<FlatList
        data={filteredGamesList}
        renderItem={({item, index, separators}) => (
          <GameCard
            game={item}
          />
        )}
        keyExtractor={item => item.id}
        onEndReachedThreshold={0.5}
      />*/}

      <Swiper
        cards={['DO', 'MORE', 'OF', 'WHAT', 'MAKES', 'YOU', 'HAPPY']}
        renderCard={(card) => {
          return (
            <View>
              <Text>{card}</Text>
            </View>
          )
        }}
        onSwiped={(cardIndex) => {console.log(cardIndex)}}
        onSwipedAll={() => {console.log('onSwipedAll')}}
        cardIndex={0}
        backgroundColor={'#4FD0E9'}
        stackSize= {3}>
        <Button
          onPress={() => {console.log('oulala')}}
          title="Press me">
          You can press me
        </Button>
      </Swiper>
    </SafeAreaView>

    /*<ScrollView style={styles.gamesList}>
      {
        gamesList?.length ?
          gamesList
            .filter((game: BoardGame) => !playerCount || game.bestplayers === playerCount)
            .map((game: BoardGame, i: number) => {
              return (
                <GameCard
                  key={i + "_" + game?.id}
                  game={game}
                />
              );
            })
          : <Text>Waiting for collection...</Text>
      }
    </ScrollView>*/
  );
};

export default BGGApi;

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
