import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons';

import { styles } from './styles'
import WaterHeader from '../../../components/Water/WaterHeader';
import { useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsFocused } from '@react-navigation/native';

const WaterHome = ({ navigation }) => {
  const menu = [
    { name: 'Download Batch', icon: <Ionicons style={styles.iconStyle} name="download-sharp" size={60} color="#00669B" /> },
    { name: 'Upload Data', icon: <Ionicons style={styles.iconStyle} name="cloud-upload-sharp" size={60} color="#00669B" /> },
    { name: 'Read & Bill', icon: <Ionicons style={styles.iconStyle} name="reader" size={60} color="#00669B" /> }
  ]

  // { name: 'Sync Formula', icon: <MaterialIcons style={styles.iconStyle} name="cloud-sync" size={60} color="#00669B" /> }

  if (menu.length % 2 !== 0) {
    menu.push({
      name: null,
      icon: null,
    })
  }

  const isFocused = useIsFocused()

  const [formula, setFormula] = useState(null);
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const retrieveFormula = async () => {
      try {
        const formulaString = await AsyncStorage.getItem('formula');
        if (formulaString) {
          setFormula(formulaString)
        }
      } catch (error) {
        alert(error)
      }
    };


    retrieveFormula();
  }, [isFocused, formula])

  const handleSync = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 10000);
    try {
      setLoading(true)
      const serverObjectString = await AsyncStorage.getItem('serverObject');
      const serverObjectJSON = await JSON.parse(serverObjectString);

      const res = await fetch(`http://${serverObjectJSON.water.ip}:${serverObjectJSON.water.port}/osiris3/json/enterprise/WaterConsumptionFormulaService.getFormula`, {signal: controller.signal});

      clearTimeout(timeoutId);

      const data = await res.json();
      if (data) {
        const tobeFormula = await AsyncStorage.setItem('formula', data.formula.toString());
        setFormula(tobeFormula)
        alert("Bill formula has been synced")
      }
    } catch (e) {
      alert(`Something went wrong, please make sure that the Water Ip address and Port is correct.`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WaterHeader navigation={navigation} />
      {
        loading ?
          <View style={styles.container}>
            <ActivityIndicator style={{ flex: 1 }} size={50} color="#00669B" />
          </View> :
          <View style={styles.container}>
            <FlatList
              data={menu}
              renderItem={(data) =>
                <TouchableOpacity style={styles.menuItemContainer} onPress={() => navigation.navigate(data.item.name)} disabled={data.item.name === null}>
                  <View style={styles.moduleItem}>
                    {data.item.icon}
                    <Text style={styles.menuTextStyle}>{data.item.name}</Text>
                  </View>
                </TouchableOpacity>
              }
              keyExtractor={(item) => item.name}
              numColumns={2}
            />
          </View>}
    </View>
  )
}

export default WaterHome