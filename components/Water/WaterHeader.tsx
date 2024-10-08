import { View, Text, Pressable, Modal, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { FontAwesome } from '@expo/vector-icons';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { styles } from './styles';

const etracslogo = require('../../assets/etracsLogo.png')


interface PropType {
  navigation: any,
  backBut?: string,
  data?: any,
  method?: any,
  icon? :any
}

const WaterHeader = ({ navigation, backBut, data, icon, method }: PropType) => {
  const [show, setShow] = useState(false)

  return (
    <View style={styles.componentContainer}>
      {
        backBut ?
          <TouchableOpacity style={styles.backButContainer} onPress={() => navigation.navigate(backBut, data)}>
            <MaterialIcons name="arrow-back-ios" size={24} color="#00669B" />
          </TouchableOpacity> :
          <View style={{ flex: 1 }}></View>
      }
      <Image
        source={etracslogo}
        style={styles.etracsLogo}
      />
      {
        method ?
          <TouchableOpacity style={styles.backButContainer} onPress={method}>
            {icon}
          </TouchableOpacity> :
          <View style={{ flex: 1 }}></View>
      }
    </View>
  )
}

export default WaterHeader

// {
//   show ?
//     <Modal visible={true} onRequestClose={() => setShow(false)}>
//       <View style={styles.modal}>
//         <View style={styles.settingContainer}>
//           <View style={{ flex: 1 }}></View>
//           <Image
//             source={etracslogo}
//             style={{ width: 100, height: 60, marginTop: 7 }}
//           />
//           <View style={{ flex: 1, alignItems: "flex-end", justifyContent: 'center' }}>
//             <MaterialCommunityIcons name="backburger" size={30} color="#00669B" onPress={() => setShow(!show)} />
//           </View>
//         </View>
//         <View style={styles.optionsContainer}>
//           <Text style={{ textAlign: 'center', padding: 10, margin: 10 }}>Option 1</Text>
//           <Text style={{ textAlign: 'center', padding: 10, margin: 10 }}>Option 2</Text>
//           <Text style={{ textAlign: 'center', padding: 10, margin: 10 }}>Option 3</Text>
//           <Text style={{ borderWidth: 1, textAlign: 'center', padding: 10, margin: 10 }} onPress={() => navigation.navigate('Login')}>Logout</Text>
//         </View>
//       </View>
//     </Modal> :
//     <View style={{ flex: 1, alignItems: "flex-end", justifyContent: 'center' }}>
//       {/* <MaterialCommunityIcons name="forwardburger" size={30} color="#00669B" onPress={() => setShow(!show)} /> */}
//     </View>
// }