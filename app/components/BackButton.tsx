import React from "react";
import { TouchableOpacity, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const BackButton = ({ label = "Back", className = "" }) => {
  const navigation = useNavigation();

  return (
    <View>
      <TouchableOpacity
        className={`px-8 py-2 rounded-lg ${className}`}
        onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }}
      >
        <Text className="text-primary-300 text-lg">{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BackButton;
