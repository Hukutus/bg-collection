import {Text, View} from "react-native";
import React, {FC} from "react";
import BGGApi from "../components/BGGApi";

const Home: FC = () => {
  return (
    <View>
      <Text>
        Welcome home!
      </Text>

      <BGGApi/>
    </View>
  );
};

export default Home;
