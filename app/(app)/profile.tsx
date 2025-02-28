import {
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import { settings } from "@/constants/data";
import { useAuth } from "@/contexts/AuthContext";

interface SettingsItemProps {
  icon: ImageSourcePropType;
  title: string;
  onPress?: () => void;
  textStyle?: string;
  showArrow?: boolean;
}

const SettingsItem = ({
  icon,
  title,
  onPress,
  textStyle,
  showArrow = true,
}: SettingsItemProps) => (
  <TouchableOpacity
    className={"flex flex-row items-center justify-between py-3"}
    onPress={onPress}
  >
    <View className={"flex flex-row items-center justify-between gap-3"}>
      <Image source={icon} className={"size-6"} />
      <Text className={`text-lg font-rubik-medium text-black-300 ${textStyle}`}>
        {title}
      </Text>
    </View>

    {showArrow && <Image source={icons.rightArrow} className={"size-5"} />}
  </TouchableOpacity>
);

const Profile = () => {
  const { user, signout } = useAuth();
  const handleLogout = async () => {
    const result = await signout();

    if (result) {
      Alert.alert("Success", "You have been logged out.");
    } else {
      Alert.alert("Error", "An error occurred while logging out.");
    }
  };

  return (
    <SafeAreaView className={"h-full bg-white"}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName={"pb-32 px-7"}
      >
        <View className={"flex flex-row items-center justify-between mt-5"}>
          <Text className={"font-rubik-bold text-xl"}>Profile</Text>
          <Image source={icons.bell} className={"size-6"} />
        </View>
        <View className={"flex flex-row justify-center mt-5"}>
          <View className={"flex flex-col items-center relative mt-5"}>
            <Image
              source={{ uri: user?.avatar }}
              className={"size-44 relative rounded-full"}
            />
            <Text className={"font-rubik-bold text-2xl mt-2"}>
              {user?.name}
            </Text>
          </View>
        </View>

        <View className={"flex flex-col mt-10"}>
          <SettingsItem icon={icons.calendar} title={"Edit Profile"} />
          <SettingsItem
            textStyle={"text-danger"}
            icon={icons.logout}
            title={"Logout"}
            onPress={handleLogout}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default Profile;
