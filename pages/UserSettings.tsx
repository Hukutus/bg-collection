import React, {FC, useEffect, useState} from "react";
import { format } from "date-fns";
import {Button, SafeAreaView, StyleSheet, Text, TextInput, View} from "react-native";
import {getUser, storeData, UserType} from "../lib/AsyncStorage";
import {publicStyles} from "../lib/Styles";
import _ from "lodash";
import {fetchCollection, getCollection} from "../lib/GameFunctions";
import {BoardGameCollectionInfo} from "../lib/BGGApi";
import {firebase} from "../lib/Firebase";
const db = firebase.firestore();

const UserSettings: FC<any> = ({route, navigation}) => {
  const [user, setUser] = useState<UserType>();
  const [collection, setCollection] = useState<BoardGameCollectionInfo>();
  const [saved, setSaved] = useState<boolean>(false);

  const checkCollection = (bggName: string | undefined): void => {
    if (!bggName) {
      return;
    }

    getCollection(bggName, false)
      .then((collection) => {
        if (!collection) {
          return;
        }
        console.log("Got collection", collection);
        setCollection(collection);
      });
  };

  useEffect(() => {
    getUser()
      .then((data: UserType | null) => {
        setUser(data || {bggName: "", alias: ""});
        checkCollection(data?.bggName);
      })
  }, []);

  const setValue = (key: keyof UserType, value: string): void => {
    const userChanges: UserType = user ? _.clone(user) : {bggName: "", alias: ""};
    userChanges[key] = value;

    setUser(userChanges);
  };

  const saveChanges = (): void => {
    storeData("@user", user)
      .then((saved: boolean) => {
        console.log("User changes saved", saved, user);
      });

    if (user?.bggName) {
      db
        .collection("User")
        .doc(user?.bggName)
        .set(user, {merge: true})
        .then(() => true);
    }
  };

  const updateCollection = (): void => {
    if (!user?.bggName) {
      return;
    }

    fetchCollection(user.bggName)
      .then((collection) => {
        if (!collection) {
          return;
        }

        setSaved(true);
        setCollection(collection);
      });
  };

  const getDate = (): string => {
    if (saved) {
      return "just now";
    }

    if (!collection?.updatedAt) {
      return "never";
    }

    try {
      return format(collection.updatedAt.toDate(), "dd.MM.yyyy HH:mm");
    } catch (e) {
      // Failed
    }

    try {
      return new Date(collection.updatedAt).toISOString();
    } catch (e) {
      return "unknown";
    }
  };

  return (
    <SafeAreaView>
      <Text style={publicStyles.header}>
        Who are you?
      </Text>

      <Text>
        BGG Username
      </Text>

      <TextInput
        onChangeText={(text: string) => setValue("bggName", text)}
        value={user?.bggName ?? ""}
      />

      <Text>
        Alias
      </Text>

      <TextInput
        onChangeText={(text: string) => setValue("alias", text)}
        value={user?.alias ?? ""}
      />

      <Button
        title={"Save changes"}
        onPress={() => saveChanges()}
      />

      <Text style={publicStyles.header}>
        Your collection
      </Text>

      {
        collection
          ? <View>
            <Text>
              Your BGG collection has {collection.games?.length} owned games
            </Text>

            <Text>
              Last updated on {getDate()}
            </Text>
          </View>
          : <Text>
            No collection found
          </Text>
      }

      <Button
        title={"Update collection"}
        onPress={() => updateCollection()}
        disabled={!user?.bggName}
      />
    </SafeAreaView>
  );
};

export default UserSettings;

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
