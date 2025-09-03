import { createStackNavigator } from "@react-navigation/stack";

import WaterHome from "../../screens/WaterModule/WaterHome/WaterHome";
import UploadBatch from "../../screens/WaterModule/UploadBatch/UploadBatch";
import DownloadBatch from "../../screens/WaterModule/DownloadBatch/DownloadBatch";

import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";
import ReadAndBill from "../../screens/WaterModule/ReadAndBill/ReadAndBill";
import UserInfo from "../../screens/WaterModule/ReadAndBill/UserInfo/UserInfo";
import BatchInfo from "../../screens/WaterModule/ReadAndBill/BatchInfo/BatchInfo";

const Stack = createStackNavigator();

const WaterHomeStack = ({navigation}) => {
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      navigation.replace("Water Home")
    }
  }, [isFocused]);

  return (
    <Stack.Navigator initialRouteName="Water Home">
        <Stack.Screen name="Water Home" component={WaterHome} options={{headerShown: false}} />
        <Stack.Screen name="Download Batch" component={DownloadBatch} options={{headerShown: false}} />
        <Stack.Screen name="Upload Data" component={UploadBatch} options={{headerShown: false}} />
        <Stack.Screen name="Read & Bill" component={ReadAndBill} options={{headerShown: false}} />
        <Stack.Screen name="User Info" component={UserInfo} options={{headerShown: false}} />
        <Stack.Screen name="Batch Info" component={BatchInfo} options={{headerShown: false}} />
    </Stack.Navigator>
  )
}

export default WaterHomeStack