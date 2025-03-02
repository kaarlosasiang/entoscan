import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { config, database, storage } from "@/lib/appwrite";
import icons from "@/constants/icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/contexts/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { ID } from "react-native-appwrite";

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
  const [isAddClassModalVisible, setIsAddClassModalVisible] = useState(false);
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    days: "",
    time: "",
    faculty: "",
  });
  const [facultyList, setFacultyList] = useState([]);
  const { user, role } = useAuth();

  const navigation = useNavigation();

  useEffect(() => {
    checkEnrollment();
    fetchFacultyList();
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
        if (role === "faculty") {
          const facultyClasses = response.documents.filter(
            (classItem) => classItem.faculty === user.$id
          );
          setClasses(facultyClasses);
        } else {
          setClasses(response.documents);
        }
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

  const fetchFacultyList = async () => {
    try {
      const response = await database.listDocuments(
        config.db,
        config.facultiesCollectionId
      );

      // const faculty = response.documents.filter((user) =>
      //   user.labels.includes("faculty")
      // );
      setFacultyList(response.documents);
    } catch (error) {
      console.error("Fetch Faculty", error);
    }
  };

  const handleClassPress = (classItem) => {
    setSelectedClass(classItem);
    if (role === "student") {
      setIsModalVisible(true);
    } else {
      setEnrolledClass(classItem);
      fetchModules(classItem.modules);
    }
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

  const handleAddModule = async () => {
    try {
      // Step 1: Pick the document
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "text/plain",
        ],
        copyToCacheDirectory: true, // This ensures the file is accessible
      });

      if (result.canceled) {
        return;
      }

      const selectedFile = result.assets[0];

      // Step 2: Convert file to base64
      const base64 = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Step 3: Create a FormData instance
      // Step 4: Upload to Appwrite
      const fileId = ID.unique();

      const uploadResponse = await storage.createFile(
        "67b9e53c000c0291cb9c",
        fileId,
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
          size: selectedFile.size,
        }
      );

      // Step 5: Update the class document with the new module
      if (uploadResponse) {
        const updatedModules = [...enrolledClass.modules, fileId];
        await database.updateDocument(
          config.db,
          config.classesCollectionId,
          enrolledClass.$id,
          { modules: updatedModules }
        );

        // Step 6: Refresh the modules list
        fetchModules(updatedModules);
        Alert.alert("Success", "Module uploaded successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(
        "Upload Failed",
        "There was an error uploading the file. Please try again."
      );
    }
  };

  const handleDeleteModule = async (moduleId) => {
    // Implement the logic to delete a module
  };

  const handleEditClass = async (classItem) => {
    // Implement the logic to edit a class
  };

  const handleDeleteClass = async (classId) => {
    // Implement the logic to delete a class
  };

  const handleAddClass = async () => {
    setLoading(true);
    try {
      const newClassDocument = {
        ...newClass,
        students: [],
        modules: [],
      };
      await database.createDocument(
        config.db,
        config.classesCollectionId,
        ID.unique(),
        newClassDocument
      );

      setClasses((prevClasses) => [...prevClasses, newClassDocument]);
      setIsAddClassModalVisible(false);
      setNewClass({
        name: "",
        description: "",
        days: "",
        time: "",
        faculty: "",
      });
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  if (
    enrolledClass &&
    (role === "faculty" || role === "admin" || role === "student")
  ) {
    return (
      <SafeAreaView className="flex h-full w-full bg-white relative">
        {role !== "student" && (
          <View className="pl-4">
            <TouchableOpacity
              onPress={() => setEnrolledClass(null)}
              className="size-10 bg-gray-200 p-2 rounded-full"
            >
              <Image source={icons.backArrow} className="size-6" />
            </TouchableOpacity>
          </View>
        )}

        <View className="p-4">
          <Image
            source={{
              uri: "https://www.gstatic.com/classroom/themes/img_reachout.jpg",
            }}
            className="w-full h-52 rounded-lg mb-4"
          />
          <Text className="text-2xl font-bold mb-2">{enrolledClass.name}</Text>
          <Text className="text-base text-gray-600 mb-2">
            {enrolledClass.description}
          </Text>
          <Text className="text-base mb-2">Time: {enrolledClass.time}</Text>
          <Text className="text-base">Days: {enrolledClass.days}</Text>
        </View>
        <View className="px-4">
          <View className="flex flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Modules</Text>
            {role === "faculty" && (
              <TouchableOpacity
                onPress={handleAddModule}
                className="px-4 py-2 bg-blue-500 rounded-full"
              >
                <Text className="text-white text-center">Add Module</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={modules}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <View className="bg-white pl-2 py-4 pr-4 rounded-2xl border border-slate-200 mb-2">
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
                {role === "faculty" && (
                  <TouchableOpacity
                    onPress={() => handleDeleteModule(item.$id)}
                    className="mt-2 px-4 py-2 bg-red-500 rounded-full"
                  >
                    <Text className="text-white text-center">
                      Delete Module
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />

          {role === "admin" && (
            <View className="flex flex-row justify-between mt-4">
              <TouchableOpacity
                onPress={() => handleEditClass(enrolledClass)}
                className="px-4 py-2 bg-green-500 rounded-full"
              >
                <Text className="text-white text-center">Edit Class</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteClass(enrolledClass.$id)}
                className="px-4 py-2 bg-red-500 rounded-full"
              >
                <Text className="text-white text-center">Delete Class</Text>
              </TouchableOpacity>
            </View>
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
            key={item.$id}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View className="px-2 py-5 flex flex-row justify-between items-center bg-white">
            <Text className={"text-xl font-rubik-bold text-black-300"}>
              Available Classes
            </Text>
            {role === "admin" && (
              <TouchableOpacity
                onPress={() => setIsAddClassModalVisible(true)}
                className="px-4 py-2 bg-blue-500 rounded-full"
              >
                <Text className="text-white text-center">Add Class</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {role === "student" && (
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
      )}

      {role === "admin" && (
        <Modal visible={isAddClassModalVisible} transparent={true}>
          <View className="flex-1 justify-center items-center bg-black/80">
            <View className="bg-white p-6 rounded-2xl w-full max-w-96">
              <Text className="text-2xl font-bold mb-4">Add New Class</Text>
              <TextInput
                placeholder="Class Name"
                value={newClass.name}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, name: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="Description"
                value={newClass.description}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, description: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="Days (e.g. MWF)"
                value={newClass.days}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, days: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <TextInput
                placeholder="Time (e.g. 1:00-2:30pm)"
                value={newClass.time}
                onChangeText={(text) =>
                  setNewClass({ ...newClass, time: text })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              />
              <Picker
                selectedValue={newClass.faculty}
                onValueChange={(itemValue) =>
                  setNewClass({ ...newClass, faculty: itemValue })
                }
                className="border border-gray-300 p-2 rounded mb-4"
              >
                {facultyList.map((faculty) => (
                  <Picker.Item
                    key={faculty.$id}
                    label={faculty.name}
                    value={faculty.$id}
                  />
                ))}
              </Picker>
              <View className="flex flex-row justify-between items-center mt-4">
                <TouchableOpacity
                  onPress={() => setIsAddClassModalVisible(false)}
                  className="rounded-full"
                >
                  <Text className="text-center">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddClass}
                  className="px-4 rounded-full bg-primary-300 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center font-rubik-medium text-white ">
                      Add Class
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

export default Classes;
