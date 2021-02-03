import {Button, SafeAreaView, StyleSheet, Text, View} from "react-native";
import React, {FC, useEffect, useState} from "react";

import {BoardGameCollectionInfo, fetchCurrentUser, fetchUser, getCollections} from "../lib/GameFunctions";
import UserToggle from "../components/UserToggle";
import {NavProp} from "./index";
import {getUser, UserType} from "../lib/AsyncStorage";
import {bggUsers} from "../config";

const Home: FC<NavProp> = ({navigation}) => {
  const [user, setUser] = useState<UserType>();
  const [collections, setCollections] = useState<BoardGameCollectionInfo[]>([]);
  const [selectedCollections, setSelectedCollections] = useState<BoardGameCollectionInfo[]>([]);

  const toggleSelectCollection = (collection: BoardGameCollectionInfo) => {
    if (selectedCollections.findIndex(coll => coll.user === collection.user) === -1) {
      // Add selection
      setSelectedCollections(prev => [...prev, collection]);
    }
    else {
      // Remove selection
      const filtered = selectedCollections.filter(coll => coll.user !== collection.user);
      setSelectedCollections(filtered);
    }
  };

  const addUnnamedPlayer = (name?: string) => {
    setCollections(prev => [...prev, {
      user: name || "" + collections.length,
      size: 0,
      games: [],
    }]);
  };

  useEffect(() => {
    (async function GetCollectionsAsync() {
      setCollections(await getCollections());

      fetchUser(bggUsers[0].name).then();

      getUser()
        .then((data: UserType | null) => {
          setUser(data || {bggName: "", alias: ""});
        });
    })();
  }, []);

  return (
    <SafeAreaView style={styles.view}>
      <Text style={styles.header}>
        Welcome {user?.alias || ""}
      </Text>

      <View style={styles.questionView}>
        <Text style={styles.questionLabel}>
          Who's playing?
        </Text>
      </View>

      <View style={styles.collections}>
        {
          collections?.map((coll, i) => (
            <UserToggle
              key={"collection_" + i + "_" + coll.user}
              i={i}
              collection={coll}
              selected={selectedCollections.indexOf(coll) !== -1}
              onPress={() => toggleSelectCollection(coll)}
            />
          ))
        }
      </View>

      <Button
        title={"+"}
        onPress={() => addUnnamedPlayer()}
      />

      <Button
        title={"Settings"}
        onPress={() => navigation.navigate("Settings")}
      />

      <Button
        title={"Game Night"}
        onPress={() => navigation.navigate("Game Night")}
      />

      <Button
        title={"View games best for your group"}
        onPress={() => navigation.navigate("Collection", {
          collections: selectedCollections
        })}
      />

      {/*<View style={styles.countSelector}>
        <Text
          style={styles.text}
        >
          How many players?
        </Text>

        <TextInput
          style={[styles.text, styles.textInput]}
          keyboardType={"numeric"}
          onChangeText={(text: string) => playerCountChange(text)}
          value={playerCount}
        />
      </View>

      <BGGApi
        playerCount={playerCount}
      />*/}
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  view: {
    flex: 1,
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    paddingTop: 24,
    backgroundColor: "lightblue"
  },
  header: {
    fontSize: 30,
    marginBottom: 10,
    fontWeight: "bold",
  },
  questionView: {
    flexDirection: "row",
  },
  questionLabel: {
    textAlign: "center",
    flex: 1,
    fontSize: 20,
    marginBottom: 10,
    fontWeight: "bold",
  },
  collections: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 30,
  },
  countSelector: {
    flexDirection: "row",
    margin: 10,
    width: "100%",
    height: 30
  },
  text: {
    height: 30,
    fontSize: 20,
    margin: 5,
    flexGrow: 1
  },
  textInput: {
    fontWeight: "bold",
    flexGrow: 1
  }
});
