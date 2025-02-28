import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { config, database, storage } from "@/lib/appwrite";
import icons from "@/constants/icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const ClassCard = ({ title, description, image, days, time, onPress }) => (
  <TouchableOpacity
    className="bg-white p-4 m-2 rounded-2xl border border-slate-200"
    onPress={onPress}
  >
    <Image
      source={{ uri: image }}
      className="w-full h-40 rounded-lg mb-2 bg-slate-100"
    />
    <View className="flex flex-row justify-between items-center">
      <View>
        <Text className="text-lg font-bold">{title}</Text>
        <Text className="text-gray-600">{description}</Text>
      </View>
      <View>
        <Image source={icons.rightArrow} className="size-6" />
      </View>
    </View>
  </TouchableOpacity>
);

const Classes = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classes, setClasses] = useState([]);
  const [enrolledClass, setEnrolledClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [downloading, setDownloading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    checkEnrollment();
  }, []);

  const checkEnrollment = async () => {
    try {
      const response = await database.listDocuments(
        config.db,
        config.classesCollectionId
      );

      const enrolledClass = response.documents.find((classItem) =>
        classItem.students.includes(user.$id)
      );

      if (enrolledClass) {
        setEnrolledClass(enrolledClass);
        fetchModules(enrolledClass.modules);
      } else {
        setClasses(response.documents);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchModules = async (moduleIds) => {
    try {
      const moduleFiles = await Promise.all(
        moduleIds.map(async (moduleId) => {
          const file = await storage.getFile(config.modulesBucket, moduleId);
          return file;
        })
      );
      setModules(moduleFiles);
    } catch (error) {
      console.error(error);
    }
  };

  const handleClassPress = (classItem) => {
    setSelectedClass(classItem);
    setIsModalVisible(true);
    fetchModules(classItem.modules);
  };

  const handleEnrollPress = async (item) => {
    setLoading(true);
    try {
      const document = await database.getDocument(
        config.db,
        config.classesCollectionId,
        item.$id
      );

      if (!document.students.includes(user.$id)) {
        const updatedStudents = [...document.students, user.$id];

        await database.updateDocument(
          config.db,
          config.classesCollectionId,
          item.$id,
          { students: updatedStudents }
        );

        setEnrolledClass(item);
        fetchModules(item.modules);
      } else {
        Alert.alert("Error", "You are already enrolled in this class.");
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
    setIsModalVisible(false);
  };

  const handleDownload = async (fileId, fileName) => {
    setDownloading(true);
    try {
      const fileUrl = storage.getFileDownload(config.modulesBucket, fileId);
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl.href, // Ensure the URL is a string
        FileSystem.documentDirectory + fileName
      );

      const { uri } = await downloadResumable.downloadAsync();
      await Sharing.shareAsync(uri);
    } catch (error) {
      console.error(error);
    }
    setDownloading(false);
  };

  const handleDropClass = async () => {
    setLoading(true);
    try {
      const document = await database.getDocument(
        config.db,
        config.classesCollectionId,
        enrolledClass.$id
      );

      const updatedStudents = document.students.filter(
        (studentId) => studentId !== user.$id
      );

      await database.updateDocument(
        config.db,
        config.classesCollectionId,
        enrolledClass.$id,
        { students: updatedStudents }
      );

      setEnrolledClass(null);
      setModules([]);
      setClasses((prevClasses) => [...prevClasses, document]);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (enrolledClass) {
    return (
      <SafeAreaView className="flex h-full w-full bg-white relative">
        <View className="p-4">
          <Image
            source={{ uri: "https://placehold.co/600x400/png" }}
            className="w-full h-52 rounded-lg mb-4"
          />
          <Text className="text-2xl font-bold mb-2">{enrolledClass.name}</Text>
          <Text className="text-base text-gray-600 mb-2">
            {enrolledClass.description}
          </Text>
          <Text className="text-base mb-2">Time: {enrolledClass.time}</Text>
          <Text className="text-base">Days: {enrolledClass.days}</Text>
        </View>
        <View className="p-4">
          <Text className="text-xl font-bold mb-4">Modules</Text>
          <FlatList
            data={modules}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleDownload(item.$id, item.name)}
                disabled={downloading}
                className="mb-2"
              >
                <View className="bg-white pl-2 py-4 pr-4 rounded-2xl border border-slate-200">
                  <View className="flex flex-row gap-2 items-center">
                    <Image source={icons.file} className="size-14" />
                    <View>
                      <Text className="font-bold text-wrap">{item.name}</Text>
                      <Text className="text-black-100 text-sm">
                        Tap to download
                      </Text>
                    </View>
                    {downloading && (
                      <ActivityIndicator size="small" color="#0000ff" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
          {enrolledClass && (
            <TouchableOpacity
              onPress={handleDropClass}
              className="px-4 rounded-full bg-red-500 py-2 mt-4"
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center font-rubik-medium text-white">
                  Drop Class
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex h-full w-full bg-white relative">
      <FlatList
        data={classes}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <ClassCard
            title={item.name}
            description={item.description}
            image={"https://placehold.co/400x100/000000/svg"} // Placeholder image URL
            days={item.days}
            time={item.time}
            onPress={() =>
              handleClassPress({
                ...item,
                image: "https://placehold.co/400x100/000000/svg",
              })
            } // Placeholder image URL
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View className="px-2 py-5 flex flex-row justify-between items-center bg-white">
            <Text className={"text-xl font-rubik-bold text-black-300"}>
              Available Classes
            </Text>
          </View>
        }
      />

      <Modal visible={isModalVisible} transparent={true}>
        <View className="flex-1 justify-center items-center bg-black/80">
          <View className="bg-white p-6 rounded-2xl w-full max-w-96">
            {selectedClass && (
              <>
                <Image
                  source={{ uri: "https://placehold.co/600x400/png" }}
                  className="w-full h-52 rounded-lg mb-4"
                />
                <Text className="text-2xl font-bold mb-2">
                  {selectedClass.name}
                </Text>
                <Text className="text-base text-gray-600 mb-2">
                  {selectedClass.description}
                </Text>
                <Text className="text-base mb-2">
                  Time: {selectedClass.time}
                </Text>
                <Text className="text-base">Days: {selectedClass.days}</Text>

                <View className="flex flex-row justify-between items-center mt-4">
                  <TouchableOpacity
                    onPress={() => setIsModalVisible(false)}
                    className="rounded-full"
                  >
                    <Text className="text-center">Close</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleEnrollPress(selectedClass)}
                    className="px-4 rounded-full bg-primary-300 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-center font-rubik-medium text-white ">
                        Enroll Class
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Classes;
