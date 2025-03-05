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
  ScrollView,
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
import { Ionicons } from "@expo/vector-icons";

const ClassCard = ({ title, description, image, days, time, onPress }) => (
  <TouchableOpacity
    className="bg-white m-2 rounded-2xl border border-slate-200 mx-5"
    onPress={onPress}
  >
    <View className="relative">
      <Image
        source={{
          uri: "https://www.gstatic.com/classroom/themes/img_reachout.jpg",
        }}
        className="absolute top-0 left-0 right-0 w-full h-full rounded-t-xl"
      />
      <View className="z-10 px-4 py-6">
        <Text className="text-4xl font-rubik-bold mb-2 text-white">
          {title}
        </Text>

        <Text className="text-lg mb-1 text-white">Time: {time}</Text>
        <Text className="text-lg text-white">{days}</Text>
      </View>
    </View>
    <View className="p-3 flex flex-row justify-between items-center">
      <Text>View Class</Text>
      <Image source={icons.rightArrow} className="size-5" />
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
        fileUrl.href,
        FileSystem.documentDirectory + fileName
      );

      const { uri } = await downloadResumable.downloadAsync();
      await Sharing.shareAsync(uri);
      Alert.alert("Success", "File downloaded successfully");
    } catch (error) {
      console.error("Download error:", error);
      Alert.alert(
        "Download Failed",
        "There was an error downloading the file. Please try again."
      );
    } finally {
      setDownloading(false);
    }
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
    try {
      // Show confirmation dialog
      Alert.alert(
        "Delete Module",
        "Are you sure you want to delete this module?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setLoading(true);
              try {
                // Step 1: Delete file from storage
                await storage.deleteFile(config.modulesBucket, moduleId);

                // Step 2: Update class document to remove module ID
                const updatedModules = enrolledClass.modules.filter(
                  (id) => id !== moduleId
                );
                await database.updateDocument(
                  config.db,
                  config.classesCollectionId,
                  enrolledClass.$id,
                  { modules: updatedModules }
                );

                // Step 3: Refresh modules list
                fetchModules(updatedModules);
                Alert.alert("Success", "Module deleted successfully");
              } catch (error) {
                console.error("Delete error:", error);
                Alert.alert(
                  "Delete Failed",
                  "There was an error deleting the module. Please try again."
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error("Delete module error:", error);
      Alert.alert(
        "Error",
        "There was an error processing your request. Please try again."
      );
    }
  };

  const handleEditClass = async (classItem) => {
    try {
      // Set up the class data for editing
      setNewClass({
        name: classItem.name,
        description: classItem.description,
        days: classItem.days,
        time: classItem.time,
        faculty: classItem.faculty,
      });

      // Show the modal for editing
      setIsAddClassModalVisible(true);

      // Update the class document
      const updatedClass = await database.updateDocument(
        config.db,
        config.classesCollectionId,
        classItem.$id,
        {
          name: newClass.name,
          description: newClass.description,
          days: newClass.days,
          time: newClass.time,
          faculty: newClass.faculty,
        }
      );

      // Update the local state
      setEnrolledClass(updatedClass);

      // Close the modal
      setIsAddClassModalVisible(false);

      Alert.alert("Success", "Class updated successfully");
    } catch (error) {
      console.error("Edit class error:", error);
      Alert.alert("Error", "Failed to update class. Please try again.");
    }
  };

  const handleDeleteClass = async (classId) => {
    Alert.alert(
      "Delete Class",
      "Are you sure you want to delete this class? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              // Delete all modules associated with the class
              if (enrolledClass.modules.length > 0) {
                await Promise.all(
                  enrolledClass.modules.map(async (moduleId) => {
                    try {
                      await storage.deleteFile(config.modulesBucket, moduleId);
                    } catch (error) {
                      console.error("Error deleting module:", error);
                    }
                  })
                );
              }

              // Delete the class document
              await database.deleteDocument(
                config.db,
                config.classesCollectionId,
                classId
              );

              // Update local state
              setEnrolledClass(null);
              setModules([]);

              // Refresh the classes list
              checkEnrollment();

              Alert.alert("Success", "Class deleted successfully");
            } catch (error) {
              console.error("Delete class error:", error);
              Alert.alert("Error", "Failed to delete class. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Modify the Add Class Modal to handle both adding and editing
  const handleAddOrUpdateClass = async () => {
    setLoading(true);
    try {
      if (enrolledClass) {
        // Update existing class
        await handleEditClass(enrolledClass);
      } else {
        // Create new class
        await handleAddClass();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to save class. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update the modal title and button text based on whether we're editing or adding
  const modalTitle = enrolledClass ? "Edit Class" : "Add New Class";
  const buttonText = enrolledClass ? "Update Class" : "Add Class";

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
      <SafeAreaView className="flex h-full w-full bg-white relative ">
        <ScrollView>
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
            <View className="relative">
              <Image
                source={{
                  uri: "https://www.gstatic.com/classroom/themes/img_reachout.jpg",
                }}
                className="absolute top-0 left-0 right-0 w-full h-52 rounded-lg"
              />
              <View className="z-10 px-4 py-6">
                <Text className="text-4xl font-rubik-bold mb-2 text-white">
                  {enrolledClass.name}
                </Text>

                <Text className="text-lg mb-1 text-white">
                  Time: {enrolledClass.time}
                </Text>
                <Text className="text-lg text-white">{enrolledClass.days}</Text>
              </View>
            </View>
          </View>

          <View className="px-4 mt-[40px]">
            <Text className="text-lg text-black-200">
              {enrolledClass.description}
            </Text>
            <View className="flex flex-row justify-between items-center mb-4 mt-[40px]">
              <Text className="text-xl font-rubik-bold">Modules</Text>
              {role === "faculty" && (
                <TouchableOpacity
                  onPress={handleAddModule}
                  className="px-4 py-2 bg-blue-500 rounded-full"
                >
                  <Text className="text-white text-center font-rubik">
                    Add Module
                  </Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={modules}
              keyExtractor={(item) => item.$id}
              renderItem={({ item }) => (
                <View className="bg-white pl-2 py-4 pr-4 rounded-2xl border border-slate-200 mb-2">
                  <TouchableOpacity
                    onPress={() => handleDownload(item.$id, item.name)}
                    className="flex flex-row gap-2 items-center"
                  >
                    <Image source={icons.file} className="size-14" />
                    <View className="flex-1">
                      <Text className="font-bold text-wrap font-rubik-medium">
                        {item.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Tap to download
                      </Text>
                    </View>
                    {downloading && (
                      <ActivityIndicator size="small" color="#0000ff" />
                    )}
                  </TouchableOpacity>

                  {role === "faculty" && (
                    <View className="flex flex-row justify-end gap-2 mt-2">
                      <TouchableOpacity
                        onPress={() => handleDeleteModule(item.$id)}
                        className="px-4 py-2 bg-red-500 rounded-full"
                      >
                        <Text className="text-white text-center font-rubik">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
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
        </ScrollView>
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
        stickyHeaderIndices={[0]}
        ListHeaderComponent={
          <View className="px-4 py-6 bg-white border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-3xl font-bold text-gray-800">
                  Classes
                </Text>
                <Text className="text-gray-500 mt-1">
                  List of available classes
                </Text>
              </View>
              {role === "admin" && (
                <TouchableOpacity
                  onPress={() => setIsAddClassModalVisible(true)}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Add</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        }
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="book-outline" size={48} color="#9ca3af" />
            <Text className="text-gray-400 mt-4 text-lg">No classes found</Text>
            <Text className="text-gray-400 text-sm">
              Add a class to get started
            </Text>
          </View>
        )}
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
              <Text className="text-2xl font-bold mb-4">{modalTitle}</Text>
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
                  onPress={handleAddOrUpdateClass}
                  className="px-4 rounded-full bg-primary-300 py-2"
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-center font-rubik-medium text-white ">
                      {buttonText}
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
