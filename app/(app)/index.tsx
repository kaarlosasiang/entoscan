import {
  Button,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, FeaturedCard } from "@/app/components/Cards";
import icons from "@/constants/icons";
import Search from "@/app/components/Search";
import Filters from "@/app/components/Filters";
import { useAuth } from "@/contexts/AuthContext";

export default function Index() {
  const { user } = useAuth();

  return (
    <SafeAreaView className={"bg-white h-full"}>
      {/* <Button title="Seed" onPress={seed}/> */}

      <FlatList
        data={[1, 2, 3, 4]}
        keyExtractor={(item) => item.toString()}
        numColumns={2}
        contentContainerClassName={"pb-32"}
        columnWrapperClassName={"flex gap-5 px-5"}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View className={"px-5"}>
            <View className={"flex flex-row items-center justify-between mt-5"}>
              <View className={"flex flex-row items-center"}>
                <Image
                  source={{ uri: user?.avatar }}
                  className={"size-12 rounded-full"}
                />
                <View
                  className={"flex flex-col ml-2 items-start justify-center"}
                >
                  <Text className={"text-xs font-rubik text-black-100"}>
                    Welcome back
                  </Text>
                  <Text
                    className={"text-base font-rubik-medium text-black-300"}
                  >
                    {user?.name}
                  </Text>
                </View>
              </View>
              {/* <Image source={icons.bell} className={"size-6"} /> */}
            </View>

            <Search />

            <View className={"my-5"}>
              <View className={"flex flex-row items-center justify-between"}>
                <Text className={"text-xl font-rubik-bold text-black-300"}>
                  Featured
                </Text>
                <TouchableOpacity>
                  <Text
                    className={"text-base font-rubik-bold text-primary-300"}
                  >
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={[1, 2, 3]}
                renderItem={({ item }) => <FeaturedCard />}
                keyExtractor={(item) => item.toString()}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName={"flex gap-5 mt-5"}
              />
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
