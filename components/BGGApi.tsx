import React, {FC, useEffect, useState} from "react";
import GameCard from "./GameCard";
import {StyleSheet, View, Text, ScrollView} from "react-native";

const parseString = require('react-native-xml2js').parseString;

import { firebase } from '../components/Firebase';
const db = firebase.firestore();

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

export interface BoardGameCollection {
  user: string;
  size: number;

  games: BoardGame[];
  gamesByPlayerCount: GamesByPlayerCount[];
  gamesFetched: boolean;
}

export interface GamesByPlayerCount {
  bestplayers: string;
  games: BoardGame[];
}

export interface BoardGame {
  id?: string;
  type?: string;

  name?: string;
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
// const newApiPath: string = "https://api.geekdo.com/api/";


const parseCollection = (resultObject: Record<string, any>[], userName: string): BoardGameCollection | null => {
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
    }),
    gamesByPlayerCount: [],
    gamesFetched: false,
  };
};

const parseBoardGameFromGeneratedJson = (resultObject: Record<string, any>): BoardGame | null => {
  if (!resultObject) {
    return null;
  }

  const stringArrays: string[] = ["description", "image", "thumbnail"];
  const numberStringArrays: string[] = ["maxplayers", "maxplaytime", "minage", "minplayers", "minplaytime", "playingtime", "yearpublished"];

  let parsedBoardGame: BoardGame = {};

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
      parsedBoardGame.playervotes = resultObject[key][0].results
        .map((item: Record<string, any>) => {
          return {
            numplayers: item.$.numplayers,
            best: item.result[0].$.numvotes,
            recommended: item.result[1].$.numvotes,
            notrecommended: item.result[2].$.numvotes,
          }
        }).sort((a: PlayerVotes, b: PlayerVotes) => {
          return b.best - a.best;
        });

      parsedBoardGame.bestplayers = parsedBoardGame.playervotes ? parsedBoardGame.playervotes[0].numplayers : "Unknown";
      // TODO also parse "language_dependence" and "suggested_playerage"
    } else if (stringArrays.indexOf(key) !== -1) {
      // Value is inside a one-length array
      parsedBoardGame[key as keyof BoardGame] = resultObject[key][0];
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
  const [collection, setCollection] = useState<BoardGameCollection>();
  const [playerCount, setPlayerCount] = useState<string>();

  /*const [user, setUser] = useState<any>(undefined);
  const [collection, setCollection] = useState<any>(undefined);

  const getUser = async (userName: string): Promise<void> => {
    await fetch(apiPath + "user?name=" + userName)
      .then((res: Response) => {
        return res.text();
      })
      .then((user) => {
        const jsonRes = convert.xml2json(user, {compact: true, spaces: 4});
        setUser(JSON.parse(jsonRes));
      })
      .catch(err => {
        setUser(null);
      });
  };*/

  // const organizeGamesByPlayerCount = (games: BoardGame[]): GamesByPlayerCount[] => {
  //   if (!games?.length) {
  //     return [];
  //   }
  //
  //   const gamesByPlayerCount: GamesByPlayerCount[] = [];
  //   for (const game of games) {
  //     const prevIndex: number = gamesByPlayerCount.findIndex(item => item.bestplayers === game.bestplayers);
  //
  //     if (prevIndex === -1) {
  //       // New entry
  //       gamesByPlayerCount.push({
  //         bestplayers: game.bestplayers || "",
  //         games: [game]
  //       });
  //     } else {
  //       // Add to previous entry
  //       gamesByPlayerCount[prevIndex].games.push(game);
  //     }
  //   }
  //
  //   console.log("Games by player count", gamesByPlayerCount?.length);
  //   return gamesByPlayerCount;
  // };

  // const sortCollection = (collection: BoardGameCollection): void => {
  //   if (!collection?.gamesByPlayerCount?.length) {
  //     return;
  //   }
  //
  //   const playerCount: number = parseInt(props.playerCount, 10);
  //   collection.gamesByPlayerCount = collection.gamesByPlayerCount.sort((a: BoardGame, b: BoardGame) => {
  //     const aB: number = parseInt(a.bestplayers || "0", 10);
  //     const bB: number = parseInt(b.bestplayers || "0", 10);
  //
  //     if (aB === bB) {
  //       return 0;
  //     }
  //
  //     if (bB === playerCount) {
  //       // Prioritize player count
  //       return -1;
  //     }
  //
  //     // Prioritize one that's closer
  //     return (bB - playerCount) - (aB - playerCount);
  //   });
  //
  //   console.log("Re-ordered collection", collection.gamesByPlayerCount);
  //   setCollection(collection);
  // };

  useEffect(() => {
    if (props.playerCount !== playerCount) {
      setPlayerCount(props.playerCount);
    }
  }, [props.playerCount]);

  const fetchGame = async (id: string): Promise<BoardGame | null> => {
    return await fetch(apiPath + "thing?id=" + id)
      .then((res: Response) => {
        return res.text();
      })
      .then((xmlString: string) => {
        return new Promise((resolve, reject) => parseString(xmlString, (err: string, result: Record<string, any>) => {
          if (err) {
            console.warn("Error with XML parse", err);
            return reject(err);
          }

          const data = result?.items?.item?.length ? result.items.item[0] : null;

          if (!data) {
            console.warn("Invalid data from XML parse", result);
            return reject("Invalid data");
          }

          resolve(data);
        })) as Promise<Record<string, any>>;
      })
      .then((result: Record<string, any>) => {
        return parseBoardGameFromGeneratedJson(result);
      })
      .catch(err => {
        console.error("Failed getting game info", err);
        return null;
      });
  };

  const addGamesToCollection = async (collection: BoardGameCollection): Promise<void> => {
    const gameList: BoardGame[] = [];
    const gamesByPlayerCount: GamesByPlayerCount[] = [];

    for (const game of collection.games) {
      if (!game.id) {
        continue;
      }

      const gameData: BoardGame | null = await fetchGame(game.id);

      if (gameData) {
        gameList.push(gameData);

        const prevIndex: number = gamesByPlayerCount.findIndex(item => item.bestplayers === gameData.bestplayers);

        if (prevIndex === -1) {
          // New entry
          gamesByPlayerCount.push({
            bestplayers: gameData.bestplayers!,
            games: [gameData]
          });
        } else {
          // Add to previous entry
          gamesByPlayerCount[prevIndex].games.push(gameData);
        }
      } else {
        console.warn("Unable to fetch game", game.name, game.id);
      }
    }

    collection.games = gameList;
    collection.gamesByPlayerCount = gamesByPlayerCount;
    collection.gamesFetched = true;

    console.log("Collection parsed!", gameList?.length, gamesByPlayerCount?.length);
    // db.collection("CompleteGameCollections").doc().set(collection);

    setCollection(collection);
  };

  useEffect(() => {
    /*if (collection && !collection?.gamesFetched) {
      console.log("Collection found, get games", collection?.user);
      // db.collection("GameCollections").doc().set(collection);

      (async function fetchGamesAsync() {
        console.log("Skip getting collection for now");
        // await addGamesToCollection(collection);
      })();
    }*/
  }, [collection]);

  const getCollection = async (userName: string): Promise<void> => {
    await fetch(apiPath + "collection?username=" + userName)
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
        setCollection(
          parseCollection(result, userName)
        );
      })
      .catch(err => {
        setCollection(null);
      });
  };

  useEffect(() => {
    if (!collection) {
      (async function fetchCollectionAsync() {
        // await getCollection("Domonation");

        db.collection("CompleteGameCollections").get().then(snapshot => {
          console.log("Found data from Firestore", snapshot.size);

          snapshot.forEach((doc) => {
            setCollection(doc.data());
          });
        });
      })();
    }
  }, []);

  return (
    <ScrollView style={styles.gamesList}>
      {
        collection?.gamesByPlayerCount?.length ?
          collection?.gamesByPlayerCount
            .filter((gamesByCount: GamesByPlayerCount) => !playerCount || gamesByCount.bestplayers === playerCount)
            .map((gamesByCount: GamesByPlayerCount, i: number) => {
              return (
                <View
                  key={"player_count_" + gamesByCount.bestplayers}
                >
                  <Text style={styles.playerCount}>
                    Best with {gamesByCount.bestplayers} players
                  </Text>

                  {
                    gamesByCount?.games.map((game: BoardGame) => {
                      return (
                        <GameCard
                          key={i + "_" + game?.id}
                          game={game}
                        />
                      );
                    })
                  }
                </View>
              )
            })
          : <Text>Waiting for collection...</Text>
      }
    </ScrollView>
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
