import {
  Client,
  Databases,
  Account,
  Avatars,
  Storage,
} from "react-native-appwrite";
import { Platform } from "react-native";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const config = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
  platform: process.env.EXPO_PUBLIC_APPWRITE_PACKAGE,
  db: process.env.EXPO_PUBLIC_DATABASE,
  insectsCollectionId: process.env.EXPO_PUBLIC_INSECTS_COLLECTION_ID,
  classesCollectionId: process.env.EXPO_PUBLIC_CLASSES_COLLECTION_ID,
  facultiesCollectionId: process.env.EXPO_PUBLIC_FACULTIES_COLLECTION_ID,
  assignmentsCollectionId: process.env.EXPO_PUBLIC_ASSIGNMENTS_COLLECTION_ID,
  insectsBucket: process.env.EXPO_PUBLIC_INSECTS_BUCKET_ID || "",
  modulesBucket: process.env.EXPO_PUBLIC_MODULES_BUCKET_ID,
  resourcesBucket: process.env.EXPO_PUBLIC_RESOURCES_BUCKET_ID,
};

const client = new Client()
  .setEndpoint(config.endpoint)
  .setProject(config.projectId)
  .setPlatform(config.platform);

const database = new Databases(client);
const account = new Account(client);
const storage = new Storage(client);

const avatar = new Avatars(client);

export { database, config, client, account, storage, avatar };
