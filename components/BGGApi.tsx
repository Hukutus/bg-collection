import React, {FC, useEffect, useState} from "react";
import {Text, View} from "react-native";
import GameCard from "./GameCard";
// import { parse } from 'fast-xml-parser';
// const convert = require("xml-js");
const parseString = require('react-native-xml2js').parseString;

export interface BGGPlayerData {
  min: number;
  max: number;
  best: number;
  recommended: number[];
}

export interface BGGBoardGameLink {
  id: number;
  text: string;
}

export interface PlayerVotes {
  numplayers: string;
  best: number;
  recommended: number;
  notrecommended: number;
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
    categories?: BGGBoardGameLink[]; // "boardgamecategory"
    mechanics?: BGGBoardGameLink[]; // "boardgamemechanic"
    families?: BGGBoardGameLink[]; // "boardgamefamily"
    expansions?: BGGBoardGameLink[]; // "boardgameexpansion"
    compilations?: BGGBoardGameLink[]; // ?? "boardgamecompilation"
    implementations?: BGGBoardGameLink[]; // "boardgameimplementation"
    artists?: BGGBoardGameLink[]; // "boardgameartist"
    publishers?: BGGBoardGameLink[]; // "boardgamepublisher"
  }
}

const apiPath: string = "https://www.boardgamegeek.com/xmlapi2/";
// const newApiPath: string = "https://api.geekdo.com/api/";


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

const BGGApi: FC = () => {
  const [games, setGames] = useState<BoardGame[]>([]);

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
  };

  const getCollection = async (userName: string): Promise<void> => {
    await fetch(apiPath + "collection?username=" + userName)
      .then((res: Response) => {
        return res.text();
      })
      .then(str => {
        return JSON.parse(convert.xml2json(str, {object: true}));
      })
      .then((collection) => {
        setCollection(collection);
      })
      .catch(err => {
        setCollection(null);
      });
  };*/

  // 6nimmt! "432"
  const fetchGameInfo = async (id: string): Promise<void> => {
    await fetch(apiPath + "thing?id=" + id)
      .then((res: Response) => {
        return res.text();
      })
      .then((xmlString: string) => {
        // console.log("Game with xml-js", convert.xml2json(str));
        // return JSON.parse(convert.xml2json(str));
        // return parse(str);
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

          resolve(result?.items.item[0]);
        }));
      })
      .then((result: Record<string, any>) => {
        console.log("Got parsed XML", result);

        setGames([
          parseBoardGameFromGeneratedJson(result)
        ]);
      })
      .catch(err => {
        console.error("Failed getting game info", err);
      });
  };

  useEffect(() => {
    if (!games?.length) {
      (async function fetchGameInfoAsync() {
        await fetchGameInfo("432");
      })();
    }
  }, []);

  return (
    <View>
      <Text>Test</Text>
      {
        games?.length ?
          games.map((game: BoardGame) => {
            return (
              <GameCard
                key={game?.id}
                game={game}
              />
            )
          })
          : <></>
      }
    </View>
  );
};

export default BGGApi;
