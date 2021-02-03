import React from "react";
import _ from "lodash";
import {decode} from 'html-entities';
import { v4 as uuid } from 'uuid';
import {firebase} from './Firebase';

import {GameNightType} from "../pages/GameNights";

const parseString = require('react-native-xml2js').parseString;
const db = firebase.firestore();

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

// Parse XML to JSON results
export const parseCollectionJson = (resultObject: Record<string, any>[], userName: string): BoardGameCollectionInfo | null => {
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

// Parse XML to JSON results
export const parseBoardGameFromGeneratedJson = (resultObject: Record<string, any>): BoardGame => {
  const stringArrays: string[] = ["image", "thumbnail"];
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
    } else if (key === "description") {
      // Parse primary description and decode HTML
      parsedBoardGame.description = decode(resultObject[key][0]);
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
      // TODO can also parse "language_dependence" and "suggested_playerage"
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

// Get games from DB
export const getGamesForGroup = async (collections: BoardGameCollectionInfo[]): Promise<BoardGame[]> => {
  if (!collections?.length) {
    return [];
  }

  const playerCount: string = collections.length.toString();
  const collectionUsers: string[] = collections.map(coll => coll.user);

  return await db
    .collection("BoardGame")
    .where("bestplayers", "==", playerCount)
    .where("ownedBy", "array-contains-any", collectionUsers)
    .get()
    .then(snapshot => {
      if (snapshot.empty || !snapshot?.docs?.length) {
        return [];
      }

      return snapshot.docs.map(item => item.data() as BoardGame);
    })

    .catch((err) => {
      console.error("Failed getting games for group", collectionUsers, err);
      return [];
    });
};

// Get games from DB
export const getGames = async (games: BoardGameInfo[]): Promise<BoardGame[]> => {
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

// Store game in DB
export const setGame = async (gameId: string | undefined, changes: BoardGame): Promise<void> => {
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

export const fetchCurrentUser = async (): Promise<void> => {
  await fetch("https://boardgamegeek.com/api/users/current", {method: "cors"})
    .then(res => {
      console.log("Current BGG user?", res);
    })
};

export const fetchUser = async (username: string): Promise<void> => {
  await fetch(apiPath + "user?name=" + username)
    .then((res: Response) => {
      return res.text();
    })
    .then((xmlString: string) => {
      return new Promise((resolve, reject) => parseString(xmlString, (err: string, result: Record<string, any>) => {
        if (err) {
          console.warn("Error with XML parse", err);
          return reject(err);
        }

        const data = result;

        if (!data) {
          console.warn("Invalid data from XML parse", result);
          return reject("Invalid data");
        }

        resolve(data as any);
      })) as Promise<any>;
    })
    .then((result: any[]) => {
      console.log("Got user DOC?", result);
    });
};

// Fetch games from BGG API
// gameIds separated by commas
export const fetchGames = async (games: BoardGameInfo[], user: string): Promise<BoardGame[]> => {
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

// Get games belonging to collection
export const getCollectionGames = async (collectionInfo: BoardGameCollectionInfo): Promise<BoardGame[]> => {
  const dbGames: BoardGame[] = await getGames(collectionInfo.games);

  // Check if all games were in DB, so no need to get games from BGG API
  if (dbGames.length === collectionInfo.games.length) {
    return dbGames;
  }

  // Get games from BGG API
  // Also saves them to DB
  return await fetchGames(collectionInfo.games, collectionInfo.user);
};

export const fetchCollection = async (userName: string, params: string = "&own=1&subtype=boardgame&excludesubtype=boardgameexpansion"): Promise<BoardGameCollectionInfo | null> => {
  // Collection not in DB, fetch from BGG API
  return await fetch(apiPath + "collection?username=" + userName + params)
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
      const parsedCollection: BoardGameCollectionInfo | null = parseCollectionJson(result, userName);

      if (parsedCollection) {
        parsedCollection.updatedAt = new Date();

        console.log("Got collection info from BGG API. Saving to DB.", parsedCollection);

        db
          .collection("GameCollections")
          .doc(userName)
          .set(parsedCollection, {merge: true});

        return parsedCollection;
      }

      return null;
    })
    .catch(err => {
      console.error("Failed getting collection", userName, err);
      return null;
    });
};

export const getCollection = async (userName: string, fetchOnMissing: boolean = true): Promise<BoardGameCollectionInfo | null> => {
  const gameCollection: BoardGameCollectionInfo | null = await db
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

  if (gameCollection) {
    return gameCollection;
  }

  console.log("Collection doesn't exist, get from BGG API", userName);
  return fetchOnMissing ? await fetchCollection(userName) : null;
};

export const getCollections = async (): Promise<BoardGameCollectionInfo[]> => {
  return await db
    .collection("GameCollections")
    .get()
    .then(snapshot => {
      if (snapshot.empty || !snapshot?.docs?.length) {
        return [];
      }

      return snapshot.docs.map(item => item.data()) as BoardGameCollectionInfo[];
    });
};

export const getGameNight = async (id: string): Promise<GameNightType | null> => {
  if (!id) {
    return null;
  }

  return await db
    .collection("GameNights")
    .where("id", "==", id)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        // No game night with given id
        return null;
      }

      return snapshot?.docs?.length ? snapshot?.docs[0]?.data() as GameNightType : null;
    });
};


// export const setGameNight = async (gameNight: GameNightType): Promise<void> => {
//   if (!gameNight) {
//     console.warn("No gameNight");
//     return;
//   }
//
//   // Check if game exists in db
//   const gameNightDoc: GameNightType | null = await db
//     .collection("GameNight")
//     .where("id", "==", gameId)
//     .get()
//     .then(snapshot => {
//       if (snapshot.empty) {
//         return null;
//       }
//
//       return snapshot?.docs?.length ? snapshot?.docs[0]?.data() as GameNightType : null;
//     });
//
//   let changeDetected: boolean = false;
//
//   if (gameDoc) {
//     // Found game in db
//     if (_.isEqual(gameDoc, changes)) {
//       // No changes
//       return;
//     } else {
//       // Update each key
//       for (const key of Object.keys(changes)) {
//         if (_.isEqual(gameDoc[key as keyof BoardGame], changes[key as keyof BoardGame])) {
//           // Value not changed
//           continue;
//         }
//
//         gameDoc[key as keyof BoardGame] = changes[key as keyof BoardGame] as any;
//         changeDetected = true;
//       }
//     }
//   } else {
//     // New entry
//     changeDetected = true;
//   }
//
//   if (!changeDetected) {
//     // Not changes
//     return;
//   }
//
//   await db
//     .collection("BoardGame")
//     .doc(gameId)
//     .set(gameDoc || changes, {merge: true});
//
//   console.log("Saved game to database", gameId, gameDoc || changes);
// };
