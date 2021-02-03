import {StyleSheet} from "react-native";

export const publicStyles = StyleSheet.create({
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
