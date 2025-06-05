import { View, Text, TextInput, ActivityIndicator, AppState, TouchableOpacity } from 'react-native'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';

import { styles } from './styles'
import { useEffect, useRef, useState } from 'react'
import WaterHeader from '../../../components/Water/WaterHeader'

import * as SQLITE from 'expo-sqlite'
import React from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SelectList } from 'react-native-dropdown-select-list'
import { removeDownloaded } from '../Others/removeDownloaded';
import DeviceInfo from 'react-native-device-info';

import Constants from "expo-constants";

const currentVersion = Constants.expoConfig.version

const DownloadBatch = ({ navigation }) => {
  const [downloading, setDownloading] = useState(false)
  const [predownloading, setPreDownloading] = useState(false)
  const [error, setError] = useState('');
  const [fileNum, setFileNum] = useState(0);
  const [curr, setCurr] = useState(0);
  const [downloaded, setDownloaded] = useState(false)
  const [selected, setSelected] = useState<any>()
  const [prevFetchNum, setPrevFetchNum] = useState(0)

  const [formula, setFormula] = useState(null);
  const [readerBatches, setReaderbatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState("")

  const [readerObj, setReaderObj] = useState(null)
  const [serverObj, setServerObj] = useState(null)

  const [uniqueId, setUniqueId] = useState('');
  const [registeredKey, setRegisteredKey] = useState('');

  const maxNum = useRef(0)

  const db = SQLITE.openDatabase('example.db');

  const exited = useRef(false)

  const currentBatch = useRef(null)
  // const prevStart = useRef(null)
  const batchDownloading = useRef(null)

  const currentStart = useRef(0)

  const getBatch = async () => {
    console.log("getBatches running")
    const readerInfo = await AsyncStorage.getItem('readerInfo');
    const storedObject = await JSON.parse(readerInfo);

    const serverObjectString = await AsyncStorage.getItem('serverObject');
    const serverObjectJSON = await JSON.parse(serverObjectString);


    const id = await DeviceInfo.getUniqueId();
    id && setUniqueId(id)
    const regkey = await AsyncStorage.getItem('registeredKey');
    regkey && setRegisteredKey(registeredKey)

    setServerObj(serverObjectJSON)
    setReaderObj(storedObject)

    const res = await fetch(`http://${serverObjectJSON.water.ip}:${serverObjectJSON.water.port}/osiris3/json/enterprise/WaterMobileReadingService.getBatches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': `WaterMobileApp/${currentVersion}` },
      cache: 'no-store',
      body: JSON.stringify({
        env: {
          CLIENTTYPE: 'mobile',
          APPVERSION: currentVersion,
          USERID: storedObject.USERID,
          SESSIONID: storedObject.env.SESSIONID,
          DEVICEID: id,
          REGKEY: regkey
        }
      }),
    });

    console.log(res)
    const data = await res.json()

    console.log(data)

    if (data.length > 0) {
      setReaderbatches(data.map((i) => {
        return { key: i.objid, value: i.objid }
      }))
    } else {
      setReaderbatches([])
    }
  }

  useEffect(() => {
    getBatch();
  }, [])

  // useEffect(() => {
  //   const getDeviceUniqueId = async () => {
  //     try {
  //       const id = await DeviceInfo.getUniqueId();
  //       id && setUniqueId(id)
  //     } catch (e) {
  //       alert(e)
  //     }
  //   }

  //   getDeviceUniqueId();
  // }, [])

  useEffect(() => {
    exited.current = false
    const unsubscribe = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        exited.current = true
        console.log("current", currentStart.current, currentBatch.current, batchDownloading.current)
        // if (currentStart.current !== null && currentBatch.current !== null && batchDownloading.current === true) {
        //   removeDownloaded(currentStart.current, currentBatch.current, "eventListener")

        //   navigation.navigate("Water Home");
        //   batchDownloading.current = false
        // }
      }
    });

    const getPrevFetchSize = async () => {
      const prevFetch = await AsyncStorage.getItem("prevFetchSize");
      if (prevFetch) {
        setPrevFetchNum(Number(prevFetch))
      } else {
        setPrevFetchNum(20)
      }
    }

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

    getPrevFetchSize();
    retrieveFormula();

    return () => {
      console.log("closing");
      unsubscribe.remove();
      exited.current = true;
      currentStart.current = 0;
    };
  }, [downloaded, batchDownloading]);

  const downloadBatch = async () => {

    const batchTable = selectedBatch.replace(/-/g, '')
    currentBatch.current = batchTable

    const getdata = async () => {
      try {
        batchDownloading.current = true
        setPreDownloading(true)
        // console.log("getData function run")

        // prevStart.current = currentStart.current

        // const readerInfo = await AsyncStorage.getItem('readerInfo');
        // const storedObject = await JSON.parse(readerInfo);

        // const serverObjectString = await AsyncStorage.getItem('serverObject');
        // const serverObjectJSON = await JSON.parse(serverObjectString);

        // console.log(`start is : ${currentStart.current}, limit is : ${selected + 1}`)

        const res = await fetch(`http://${serverObj.water.ip}:${serverObj.water.port}/osiris3/json/enterprise/WaterMobileReadingService.getBatchItems`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': `WaterMobileApp/${currentVersion}` },
          cache: 'no-store',
          body: JSON.stringify({
            env: {
              CLIENTTYPE: 'mobile',
              USERID: readerObj.USERID,
              SESSIONID: readerObj.env.SESSIONID,
              DEVICEID: uniqueId,
              REGKEY: registeredKey,
              APPVERSION: currentVersion,
            },
            args: {
              batchid: selectedBatch,
              start: currentStart.current,
              limit: selected + 1
            },
          }),
        });

        const dataRes = await res.json();

        // console.log(dataRes)

        if (dataRes.msg) {
          setError(dataRes.msg)
          setPreDownloading(false)
          await AsyncStorage.removeItem(`${batchTable}Start`);
          await AsyncStorage.removeItem(`${batchTable}`);
          setPreDownloading(false)
          batchDownloading.current = false;
        } else if (dataRes.length !== 0) {
          db.transaction(tx => {
            tx.executeSql(`
              CREATE TABLE IF NOT EXISTS ${batchTable} (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                batchid TEXT,
                acctno TEXT UNIQUE,
                prevreading INTEGER,
                reading INTEGER,
                volume INTEGER,
                rate INTEGER,
                acctname TEXT,
                capacity INTEGER,
                brand TEXT,
                meterno TEXT,
                billdate TEXT,
                duedate TEXT,
                discdate TEXT,
                amount INTEGER,
                classification TEXT,
                penalty INTEGER,
                discount INTEGER,
                acctgroup TEXT,
                fromdate TEXT,
                todate TEXT,
                location TEXT,
                reader TEXT,
                balance INTEGER,
                note TEXT,
                noteDate TEXT,
                uploaded INTEGER,
                sigData TEXT,
                receiver TEXT,
                receiveDate TEXT,
                qrcode TEXT,
                othercharge INTEGER,
                disconnectiondate TEXT
              )
            `, null,
              () => console.log("table created"),
              (_, error) => {
                console.log('table not created', error);
                return false
              }
            );
          }, (err) => {
            console.log("error", err)
          });

          const newData = await dataRes.map((e: any, i: any) => ({
            ...e,
            "note": "",
          }))

          console.log(newData)

          let data;

          await newData.length === selected + 1 ? data = await newData.slice(0, newData.length - 1) : data = await newData;

          setPreDownloading(false)
          setDownloading(true)

          let newNum = data.length;

          for (let i = 0; i < newNum; i++) {
            await new Promise((res) => setTimeout(res, 50))
            if (exited.current) {
              console.log("break")
              // console.log("prevstart:", prevStart.current)
              // if (currentStart.current !== null && currentBatch.current !== null && batchDownloading.current === true) {
              //   removeDownloaded(currentStart.current, currentBatch.current, "function")
              //   console.log(exited.current)
              //   navigation.navigate("Water Home");
              // }
              break;
            } else {
              db.transaction(tx => {
                tx.executeSql(`INSERT OR IGNORE INTO ${batchTable} (batchid, acctno, prevreading, reading, volume, rate, acctname, capacity, brand, meterno, billdate, duedate, discdate, amount, classification, penalty, discount, acctgroup, fromdate, todate, location, reader, balance, note, uploaded, sigData, receiver, receiveDate, noteDate, qrcode, othercharge, disconnectiondate) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
                  [data[i].batchid, data[i].acctno, data[i].prevreading ? data[i].prevreading : 0, data[i].reading, data[i].volume, data[i].rate, data[i].acctname, data[i].meter.capacity, data[i].meter.brand, data[i].meter.serialno, data[i].billdate, data[i].duedate, data[i].discdate, data[i].amount, data[i].classificationid, data[i].penalty, data[i].discount, data[i].acctgroup, data[i].fromdate, data[i].todate, data[i].location.text, data[i].reader.name, 0, data[i].note, 0, "", "", "", "", "", data[i].othercharge ? data[i].othercharge : 0, data[i].disconnectiondate ? data[i].disconnectiondate : ""], (_, result) => {
                    console.log('Insert result:', result);
                  },
                  (_, error) => {
                    console.log('Insert error:', error);
                    return false
                  }
                )

              })
              maxNum.current += 1
              setCurr(currentStart.current + i + 1)
              if (i === newNum - 1 && exited.current !== true) {
                // setFileNum(data[i].pageNum + 1)
                batchDownloading.current = false
                currentStart.current += selected
              }
            }
          }

          const booleanValueToSave = dataRes.length === selected + 1 ? true : false

          if (booleanValueToSave && !exited.current) {
            await getdata();
          } else {
            setError("All accounts already downloaded")
          }

          setDownloaded(true)
          setError('')

        }

      } catch (error) {
        console.log(error)
        setPreDownloading(false)
        setDownloading(false)
        setError(`Error: ${error}`)
        batchDownloading.current = false;
      } finally {
        setPreDownloading(false)
        setSelectedBatch('')
        batchDownloading.current = false;
      }
    }

    // db.transaction(tx => {
    //   tx.executeSql(
    //     `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
    //     [batchTable],
    //     (txObj, resultSet) => {
    //       if (resultSet.rows.length > 0) {
    //         tx.executeSql(`DROP TABLE ${batchTable}`, null, async (txObj, resultSet) => {
    //           console.log("table dropped")
    //         });
    //       } else {
    //         console.log(`Table ${batchTable} does not exist.`);
    //       }
    //       currentStart.current = 0
    //     },
    //     (txObj, error) => {
    //       console.log("Error checking for table existence:", error);
    //       return false
    //     }
    //   );
    // });

    await new Promise((res) => setTimeout(res, 100))
    await getdata();

    console.log("Curr", maxNum.current)
    await AsyncStorage.setItem(`${batchTable}Max`, JSON.stringify(maxNum.current));

    maxNum.current = 0
    currentStart.current = 0
  }

  const downloadAnotherBatch = () => {
    setDownloaded(false);
    setDownloading(false)
  }

  if (downloading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <WaterHeader navigation={navigation} />
        {
          !downloaded ?
            <View style={styles.container}>
              <View style={styles.infoContainer}>
                <Text style={{ ...styles.menuText, color: 'green' }}>Downloading ...</Text>
                <Text style={{ fontSize: 20, fontWeight: '400' }}>Batch: {selectedBatch}</Text>
                <Text>Records Downloaded:  {curr}</Text>
              </View>
            </View>
            :
            <View style={styles.container}>
              <View style={styles.infoContainer}>
                <Text style={{ ...styles.menuText, color: 'green' }}>Download Complete !!!</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <Text>{curr} Records Downloaded</Text>
                  <TouchableOpacity style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', gap: 5, borderRadius: 5, borderWidth: 1, paddingHorizontal: 5, borderColor: 'rgba(0, 0, 0, 0.1)' }}
                    onPress={() => {
                      setPreDownloading(false)
                      setSelectedBatch('')
                      setError('')
                      setDownloaded(false);
                      setDownloading(false)
                      navigation.navigate('Batch Info', { batchname: currentBatch.current })
                    }}>
                    <Text>View</Text>
                    <MaterialIcons name="pageview" size={24} color="#00669B" />
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate("Water Home")} style={styles.goToHomeButton}>
                <Text style={{ color: 'white' }}>Go to Home</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={downloadAnotherBatch} style={styles.downloadedbackButton}>
                <Text style={{ color: 'black' }}>Download Another Batch</Text>
              </TouchableOpacity>
            </View>
        }

      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <WaterHeader navigation={navigation} backBut='Water Home' icon={<FontAwesome name="refresh" size={23} color="#00669B" />} method={getBatch} />
      <View style={styles.container}>
        {predownloading ?
          <ActivityIndicator style={{ flex: 1 }} size={100} color="#00669B" /> :
          <View style={styles.infoContainer}>
            <Text style={styles.menuText}>Download Batch</Text>
            <View style={{ flex: 1, width: 250 }}>
              {error && <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 2 }}>
                  <SelectList
                    data={readerBatches}
                    setSelected={setSelectedBatch}
                    search={false}
                    placeholder='Select Batch ID'
                    defaultOption={selectedBatch ? readerBatches.find(obj => obj.value === selectedBatch) : readerBatches[0]}
                    boxStyles={{ height: 50 }}
                    onSelect={() => {
                      // console.log(selectedBatch)
                    }}
                    maxHeight={200}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <SelectList
                    data={[
                      { key: 20, value: 20 },
                      { key: 30, value: 30 },
                      { key: 40, value: 40 },
                      { key: 50, value: 50 }
                    ]}
                    setSelected={setSelected}
                    search={false}
                    defaultOption={{ key: prevFetchNum, value: prevFetchNum }}
                    boxStyles={{ height: 50 }}
                    onSelect={() => {
                      // console.log(selected)
                    }}
                    maxHeight={200}
                  />
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, width: 250 }}>
              <TouchableOpacity style={selectedBatch ? { ...styles.downloadButton, flex: 2 } : { ...styles.downloadButton, backgroundColor: 'grey' }} onPress={downloadBatch} disabled={selectedBatch ? false : true}>
                <Text style={{ color: 'white', textAlign: 'center' }}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      </View>
    </View>
  )
}

export default DownloadBatch