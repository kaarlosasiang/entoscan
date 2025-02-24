import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

const modules = [
  {
    id: "1",
    title: "Class 1",
    description: "Description for Module 1",
    image: "https://via.placeholder.com/150",
  },
  {
    id: "2",
    title: "Class 2",
    description: "Description for Module 2",
    image: "https://via.placeholder.com/150",
  },
];

const ModuleCard = ({ title, description, image }) => (
  <TouchableOpacity className="bg-white p-4 m-2 rounded-2xl border border-slate-200">
    <Image
      source={{ uri: image }}
      className="w-full h-40 rounded-lg mb-2 bg-slate-100"
    />
    <Text className="text-lg font-bold">{title}</Text>
    <Text className="text-gray-600">{description}</Text>
  </TouchableOpacity>
);

const Modules = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [classId, setClassId] = useState("");

  return (
    <SafeAreaView className="flex h-full w-full bg-white relative">
      <FlatList
        data={modules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ModuleCard
            title={item.title}
            description={item.description}
            image={item.image}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View className="px-2 py-5 flex flex-row justify-between items-center bg-white">
            <Text className={"text-xl font-rubik-bold text-black-300"}>
              My Modules
            </Text>
            <TouchableOpacity onPress={() => setIsModalVisible(true)}>
              <Text className="text-primary-300 mb-1">Join Class</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View className="flex-1 justify-center items-center bg-black/80">
          <View className="bg-white p-6 rounded-2xl w-full max-w-96">
            <Text className="text-base font-bold mb-2">Enter Class ID</Text>
            <TextInput
              value={classId}
              onChangeText={setClassId}
              placeholder=""
              className="border border-gray-300 p-3 mb-4 font-rubik text-black-300 rounded-lg"
            />
            <View className="flex flex-row justify-between">
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="mt-2 px-2 rounded-full"
              >
                <Text className="text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="bg-primary-300 px-4 py-2 rounded-lg"
              >
                <Text className="text-white text-center">Join Class</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Modules;
