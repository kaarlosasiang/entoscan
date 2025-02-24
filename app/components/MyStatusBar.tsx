import { StatusBar } from "expo-status-bar";
import React from "react";
import { useColorScheme } from "react-native";

const MyStatusBar = () => {
  const colorScheme = useColorScheme();

  return <StatusBar style="dark" />;
};

export default MyStatusBar;
