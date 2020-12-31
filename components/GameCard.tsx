import React, {FC} from "react";
import { View, Text} from "react-native";
import styled from 'styled-components/native';
import {BoardGame} from "./BGGApi";

const StyledView = styled.View`
  background-color: papayawhip;
  flex: 1;
  flex-direction: row;
`;

export type GameCardType = {
  game?: BoardGame;
}

const GameCard: FC<GameCardType> = (props: GameCardType) => {
  return (
    <StyledView>
      {/*<Image
        source={props.game?.image}
        style={{width: 100, height: 100}}
      />*/}
      <Text>{props.game?.name}</Text>
    </StyledView>
  );
};

export default GameCard;
