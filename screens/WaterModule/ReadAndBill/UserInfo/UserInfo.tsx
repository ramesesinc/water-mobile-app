import { View, Text, Pressable, Modal, ActivityIndicator, TextInput, TouchableOpacity, Image, Button } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { styles1, styles2 } from './styles'
import { Ionicons, FontAwesome6, FontAwesome } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';
import Signature from 'react-native-signature-canvas';
import OtpTextInput from 'react-native-text-input-otp'

import WaterHeader from '../../../../components/Water/WaterHeader'
import { UserType } from '../../Others/types';

import * as SQLITE from 'expo-sqlite'
import * as FileSystem from 'expo-file-system';
import ThermalPrinterModule from 'react-native-thermal-printer';

import { Asset } from 'expo-asset';
import { useIsFocused } from '@react-navigation/native';
import { printFormat } from '../../Others/printFromat';

import { Dimensions } from 'react-native';
import { currencyFormat } from '../../Others/formatCurrency';

import ensureFourDecimalPlaces from '../../Others/ensureFourDecimalPlaces';
import Service from "../../../../common/lib/server/remote-service.js";
import DeviceInfo from 'react-native-device-info';

const { height } = Dimensions.get('window');
const db = SQLITE.openDatabase('example.db');

const UserInfo = ({ navigation, route }) => {
    const [open, setOpen] = useState(false)
    const [noteOpen, setNoteOpen] = useState(false)
    const [rateOpenOk, setRateOpenOk] = useState(false)

    const [signatureData, setSignatureData] = useState("")
    const [sigOpen, setSigOpen] = useState(false)
    const [receiver, setReceiver] = useState("")
    const signatureRef = useRef<any>(null);

    const [edit, setEdit] = useState(false)
    const [user, setUser] = useState<UserType>({
        batchid: null,
        acctno: null,
        prevreading: null,
        reading: null,
        volume: null,
        rate: null,
        acctname: null,
        capacity: null,
        brand: null,
        meterno: null,
        billdate: null,
        duedate: null,
        discdate: null,
        amount: null,
        classification: null,
        penalty: null,
        discount: null,
        acctgroup: null,
        fromdate: null,
        todate: null,
        location: null,
        reader: null,
        balance: null,
        pageNum: null,
        note: null,
        uploaded: null,
        sigData: null,
        receiver: null,
        receiveDate: null,
        noteDate: null,
        qrcode: null,
        othercharge: null,
        disconnectiondate: null
    })
    const [headers, setHeaders] = useState({
        header1: "",
        header2: "",
        header3: ""
    })

    const [readerObj, setReaderObj] = useState(null)
    const [serverObj, setServerObj] = useState(null)

    const [numberValue, setNumberValue] = useState([])
    const [decimalValue, setDecimalValue] = useState(["0", "0", "0", "0"]);
    const [noteInput, setNoteInput] = useState("")
    const [formula, setFormula] = useState(null)

    const [otp, setOtp] = React.useState('');
    const computedRef = useRef({
        balance: 0,
        total: null,
        rate: null,
        duedate: null,
        disconnectiondate: null,
        qrcode: null
    })
    const printRef = useRef(null)

    const [uniqueId, setUniqueId] = useState('');

    // const hdb = SQLITE.openDatabase('headers.db');

    const date = new Date();
    const currentDate = `${date.getFullYear()}-${date.getDate()}-${date.getMonth()}`
    const isFocused = useIsFocused()
    const { userAccNo, batchname } = route.params;

    const retrieveData = async () => {
        try {
            const storedString = await AsyncStorage.getItem('header');
            if (storedString !== null) {
                const storedObject = await JSON.parse(storedString);
                setHeaders(storedObject)
            }
        } catch (error) {
            console.error('Error retrieving object:', error);
        }
    };

    const retrieveFormula = async () => {
        try {
            const storedString = await AsyncStorage.getItem('formula');
            if (storedString !== null) {
                setFormula(storedString)
            }
        } catch (error) {
            console.error('Error retrieving object:', error);
        }
    };

    useEffect(() => {
        const getDeviceUniqueId = async () => {
            try {
                const id = await DeviceInfo.getUniqueId();
                id && setUniqueId(id)
            } catch (e) {
                alert(e)
            }
        }

        getDeviceUniqueId();
    }, [])

    useEffect(() => {
        const dlPicture = async () => {
            const imageAsset = Asset.fromModule(require('../../../../assets/printerLogoExample2.jpg'));

            if (!imageAsset.localUri) {
                console.log("downloadAsyn Run")
                await imageAsset.downloadAsync();
            }
            // const exampleImageUri = Image.resolveAssetSource(imageAsset).uri
            let printLogoUri: string;

            const localUri = `${FileSystem.cacheDirectory}printerLogoExample2.jpg`;

            const fileInfo = await FileSystem.getInfoAsync(localUri);
            console.log(`file Exist? ${fileInfo.exists}`)
            if (!fileInfo.exists) {
                console.log("copyAsyn Run")
                await FileSystem.copyAsync({
                    from: imageAsset.localUri || imageAsset.uri,
                    to: localUri,
                });
            }
            // Load the copied asset
            const copiedAsset = Asset.fromURI(localUri);
            copiedAsset.localUri = localUri; // Need to set the localUri for loadAsync() to work
            const [copy] = await Asset.loadAsync(
                copiedAsset.localUri || copiedAsset.uri
            );

            printLogoUri = copy.localUri ?? copy.uri;

            // alert(printLogoUri)
            setImageUrl(printLogoUri)

        }

        const getReaderInfo = async () => {
            const readerInfo = await AsyncStorage.getItem('readerInfo');
            const storedObject = await JSON.parse(readerInfo);

            const serverObjectString = await AsyncStorage.getItem('serverObject');
            const serverObjectJSON = await JSON.parse(serverObjectString);

            setServerObj(serverObjectJSON)
            setReaderObj(storedObject)
        }

        dlPicture();
        getReaderInfo();

        const date = new Date();
        console.log(`${date.getFullYear()}-${date.getDate()}-${date.getMonth()}`)
    }, [])

    useEffect(() => {
        if (isFocused) {
            db.transaction(
                tx => {
                    tx.executeSql(`SELECT * FROM ${batchname} WHERE acctno = ?`, [userAccNo],
                        (txObj, resultSet) => {
                            setUser(resultSet.rows._array[0]);
                            // console.log(resultSet.rows._array[0].sigData)
                            const numberString = resultSet.rows._array[0].capacity.toString().match(/0/g) || [];
                            const newArr = []
                            numberString.map(() => {
                                newArr.push('0')
                            });

                            if (user.reading !== null) {
                                const val = Math.floor(user.reading).toString()
                                let arrIndex = newArr.length - 1
                                for (let i = val.length - 1; i >= 0; i--) {
                                    newArr[arrIndex] = val[i];
                                    arrIndex = arrIndex - 1
                                }
                                setNumberValue(newArr)

                                const retrievedDecimal = user.reading.toFixed(4).split(".")[1].split("")
                                setDecimalValue(retrievedDecimal)
                            } else if (user.prevreading !== 0 && user.prevreading !== null) {
                                const val = Math.floor(user.prevreading).toString()
                                let arrIndex = newArr.length - 1
                                for (let i = val.length - 1; i >= 0; i--) {
                                    newArr[arrIndex] = val[i];
                                    arrIndex = arrIndex - 1
                                }
                                setNumberValue(newArr)

                                if (user.reading) {
                                    const retrievedDecimal = user.reading.toFixed(4).split(".")[1].split("")
                                    setDecimalValue(retrievedDecimal)
                                }
                            } else {
                                setNumberValue(numberString)
                            }
                        }
                    );
                }
            );

            retrieveFormula();
            retrieveData();
            console.log("useEffect ran")
        }
    }, [open, isFocused, noteOpen, sigOpen, rateOpenOk]);

    const [imageUrl, setImageUrl] = useState(null)

    let styles = null

    if (height < 600) {
        styles = styles1
    } else if (height > 600 && height < 1000) {
        styles = styles2
    }

    const webStyle = `.m-signature-pad {box-shadow: none; border: none; } 
              .m-signature-pad--body {border: none;}
              .m-signature-pad--footer {display: none; margin: 0px;}
              body,html {
              width: ${300}px; height: ${200}px;}`;;

    // const handleEndDrawing = () => {
    //     signatureRef.current?.readSignature();
    // };
    // const handleOK = (signature: any) => {
    //     // const base64code = signature.replace('data:image/png;base64,', 'data:image/png;base64,');
    //     setSignatureData(signature)
    //     console.log(typeof (signature))
    // };

    const getRate = async () => {
        try {
            if (user.rate) {
                printReceipt();
            } else {
                const orgid = readerObj.env.ORGID
                console.log("orgid:", orgid, typeof (orgid))
                const svc = await Service.lookup(`${orgid}:OnlineWaterMobileReadingService`, "water");

                const compute_param = {
                    batchid: user.batchid,
                    acctno: user.acctno,
                    prevreading: user.prevreading,
                    reading: user.reading,
                    volume: user.volume,
                    deviceUniqueId: uniqueId
                }

                async function invokeWithTimeout(promise, timeout) {
                    return Promise.race([
                        promise,
                        new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Operation timed out")), timeout)
                        ),
                    ]);
                }
                console.log("1")

                const data = await invokeWithTimeout(svc.invoke("compute", compute_param), 30000);

                console.log("data", data)
                if (data) {
                    const computed = await data
                    console.log("computed", computed)
                    computedRef.current = { ...computed, qrcode: computed.qrcode.replace(/^qrcode:/, '') }
                    if (!computedRef.current.balance) {
                        computedRef.current.balance = 0
                    }
                    computedRef.current.total = computedRef.current.rate + computedRef.current.balance
                    console.log(computedRef)
                    setRateOpenOk(true)
                }
            }

        } catch (e) {
            alert(`Error: ${e}`)
        }
    }

    const handleFirstStep = () => {
        if (user.sigData) {
            printReceipt()
        } else {
            setRateOpenOk(true)
        }
    }

    const inputRefs = useRef([]);

    const handleInputChange = (text, index) => {
        const newInputs = [...numberValue];
        newInputs[index] = text;
        setNumberValue(newInputs);
    };

    const handleOnKeyPressNumber = (index) => {
        if (index < numberValue.length - 1) {
            inputRefs.current[index + 1].focus();
        }
    }

    const decimalRefs = useRef([])

    const handleDecimalChange = (text, index) => {
        const newInputs = [...decimalValue];
        newInputs[index] = text;
        setDecimalValue(newInputs);
    };

    const handleOnKeyPressDecimal = (index) => {
        if (index < decimalValue.length - 1) {
            decimalRefs.current[index + 1].focus();
        }
    }

    const handleSave = async () => {
        try {
            const newNumber = numberValue.map((item) => item === "" ? item = "0" : item)
            const newDecimal = decimalValue.map((item) => item === "" ? item = "0" : item)
            const newReadStr = newNumber.join('') + '.' + newDecimal.join('');
            const newRead = Number(newReadStr);

            // console.log(newNumber, newDecimal, newRead)

            if (newRead !== 0) {
                let toSubstractFrom = newRead
                if (user.prevreading > newRead) {
                    toSubstractFrom = (user.capacity + toSubstractFrom) - 1

                }

                const newVol = Number((toSubstractFrom - user.prevreading).toFixed(4));
                console.log(user.prevreading, newRead, user.volume)
                // const func = eval(formula)
                // const result = func({ ...user, volume: newVol })

                db.transaction(
                    tx => {
                        tx.executeSql(
                            `UPDATE ${batchname} SET reading = ?, volume = ? WHERE acctno = ?`,
                            [newRead, newVol, user.acctno],
                            (txObj, resultSet) => {
                                console.log('Updated reading, volume');
                            },
                            (txObj, error) => {
                                console.error('Error updating reading, volume:', error);
                                return false
                            }
                        );
                    }
                );
            }

        } catch (e) {
            console.log("error:", e)
        } finally {
            setOpen(false)
        }
    }

    const saveNote = () => {
        db.transaction(
            tx => {
                tx.executeSql(
                    `UPDATE ${batchname} SET note = ?, noteDate = ? WHERE acctno = ?`,
                    [noteInput, currentDate, user.acctno],
                    (txObj, resultSet) => {
                        console.log('Updated note');
                    },
                    (txObj, error) => {
                        console.error('Error updating note:', error);
                        return false
                    }
                );
            }
        );
        setNoteInput("")
        setNoteOpen(false)
    }

    const unHold = () => {
        db.transaction(
            tx => {
                tx.executeSql(
                    `UPDATE ${batchname} SET note = ? WHERE acctno = ?`,
                    ["", user.acctno],
                    (txObj, resultSet) => {
                        console.log('Updated note');
                    },
                    (txObj, error) => {
                        console.error('Error updating note:', error);
                        return false
                    }
                );
            }
        );
        db.transaction(
            tx => {
                tx.executeSql(`SELECT * FROM ${batchname} WHERE acctno = ?`, [userAccNo],
                    (txObj, resultSet) => {
                        setUser(resultSet.rows._array[0]);
                        // const numberString = resultSet.rows._array[0].capacity.toString().match(/0/g) || [];
                        // const newArr = []
                        // numberString.map(() => {
                        //     newArr.push('0')
                        // });

                        // if (user.reading !== null) {
                        //     const val = Math.floor(user.reading).toString()
                        //     let arrIndex = newArr.length - 1
                        //     for (let i = val.length - 1; i >= 0; i--) {
                        //         newArr[arrIndex] = val[i];
                        //         arrIndex = arrIndex - 1
                        //     }
                        //     setNumberValue(newArr)
                        // }
                    }
                );
            }
        );

        // retrieveFormula();
        // retrieveData();

        setEdit(false)
    }

    const editNote = () => {
        db.transaction(
            tx => {
                tx.executeSql(`SELECT * FROM ${batchname} WHERE acctno = ?`, [userAccNo],
                    (txObj, resultSet) => {
                        setNoteInput(resultSet.rows._array[0].note)
                    }
                );
            }
        );
        setEdit(true)
        setNoteOpen(true)
    }

    // const handleContinue = () => {
    //     setRateOpenOk(false)
    //     setSigOpen(true)
    // }


    // const handleConfirmWithSig = async () => {
    //     try {
    //         if (signatureData !== "" && receiver !== "") {
    //             const orgid = readerObj.env.ORGID
    //             const svc = await Service.lookup(`${orgid}:OnlineWaterMobileReadingService`, "water");

    //             const upload_param = {
    //                 batchid: user.batchid,
    //                 acctno: user.acctno,
    //                 prevreading: user.prevreading,
    //                 reading: user.reading,
    //                 volume: user.volume,
    //                 rate: computedRef.current.rate,
    //                 duedate: computedRef.current.duedate,
    //                 receivedby: {
    //                     name: receiver,
    //                     date: user.receiveDate,
    //                     signature: signatureData
    //                 },
    //                 hold: user.note ? {
    //                     message: user.note,
    //                     date: user.noteDate
    //                 } : null
    //             }
    //             const data = await svc.invoke("uploadReading", upload_param);

    //             console.log("data in uploadReading", data)

    //             if (data) {
    //                 db.transaction(
    //                     tx => {
    //                         tx.executeSql(
    //                             `UPDATE ${batchname} SET uploaded = ?, sigData = ?, receiver = ?, rate = ?, duedate = ?, receiveDate = ?, qrcode = ? WHERE acctno = ?`,
    //                             [1, signatureData, receiver, computedRef.current.rate, computedRef.current.duedate, currentDate, computedRef.current.qrcode, user.acctno,],
    //                             (txObj, resultSet) => {
    //                                 console.log('Updated uploaded');
    //                                 setSigOpen(false)
    //                                 signatureRef.current && signatureRef.current.clearSignature();
    //                                 setSignatureData("")
    //                                 printReceipt();
    //                             },
    //                             (txObj, error) => {
    //                                 console.error('Error updating uploaded:', error);
    //                                 return false
    //                             }
    //                         );
    //                     }
    //                 );
    //             }
    //         } else {
    //             alert("Cant confirm without a receiver's name and sign")
    //         }

    //     } catch (e) {
    //         setSigOpen(false)
    //         signatureRef.current && signatureRef.current.clearSignature();
    //         setSignatureData("")
    //         alert(`Error uploading: ${e}`)
    //     }
    // }

    const handleConfirm = async () => {
        try {
            const orgid = readerObj.env.ORGID
            const svc = await Service.lookup(`${orgid}:OnlineWaterMobileReadingService`, "water");

            const upload_param = {
                batchid: user.batchid,
                acctno: user.acctno,
                prevreading: user.prevreading,
                reading: user.reading,
                volume: user.volume,
                rate: computedRef.current.rate,
                duedate: computedRef.current.duedate,
                receivedby: {
                    name: receiver,
                    date: user.receiveDate,
                    signature: signatureData
                },
                hold: user.note ? {
                    message: user.note,
                    date: user.noteDate
                } : null,
                deviceUniqueId: uniqueId
            }
            const data = await svc.invoke("uploadReading", upload_param);

            console.log("data in uploadReading", data)
            console.log("ComputedRef:", computedRef.current)

            if (data) {
                db.transaction(
                    tx => {
                        tx.executeSql(
                            `UPDATE ${batchname} SET uploaded = ?, receiver = ?, rate = ?, duedate = ?, receiveDate = ?, qrcode = ?, disconnectiondate = ?, balance = ? WHERE acctno = ?`,
                            [1, receiver, computedRef.current.rate, computedRef.current.duedate, currentDate, computedRef.current.qrcode, computedRef.current.disconnectiondate ? computedRef.current.disconnectiondate : '', computedRef.current.balance ? computedRef.current.balance : 0, user.acctno,],
                            (txObj, resultSet) => {
                                console.log('Updated uploaded');
                                setSigOpen(false)
                                printReceipt();
                            },
                            (txObj, error) => {
                                console.error('Error updating uploaded:', error);
                                return false
                            }
                        );
                    }
                );
                setRateOpenOk(false)
            }

        } catch (e) {
            setRateOpenOk(false)
            alert(`Error uploading: ${e}`)
        }
    }

    // const printReceiptWithSig = async () => {
    //     try {
    //         await ThermalPrinterModule.printBluetooth({
    //             payload: printFormat(user, headers, imageUrl, user.sigData ? user.sigData : signatureData, user.receiver ? user.receiver : receiver, user.rate > 0 ? user.rate : computedRef.current.rate, user.qrcode ? user.qrcode : computedRef.current.qrcode, user.disconnectiondate ? user.disconnectiondate : computedRef.current.disconnectiondate),
    //             printerWidthMM: 48,
    //             printerNbrCharactersPerLine: 32
    //         })

    //     } catch (err) {
    //         //error handling
    //         alert(err)
    //         console.log(err.message);
    //     }
    // };

    const printReceipt = async () => {
        // console.log(`userBal: ${user.balance}`)
        try {

            // console.log(`userBal: ${user.balance}, compBal: ${computedRef.current.balance}`)
            await ThermalPrinterModule.printBluetooth({
                payload: printFormat(user, headers, imageUrl, "", user.receiver ? user.receiver : receiver, user.rate > 0 ? user.rate : computedRef.current.rate, user.qrcode ? user.qrcode : computedRef.current.qrcode, user.disconnectiondate || '', user.balance !== null && user.balance !== 0 ? user.balance : computedRef.current.balance),
                printerWidthMM: 48,
                printerNbrCharactersPerLine: 32
            })

        } catch (err) {
            //error handling
            alert(`Print error: ${err}`)
            console.log(err.message);
        }
    };

    const handleCancel = () => {
        setSigOpen(false)
        setSignatureData("")
    }

    return (
        <View style={{ flex: 1, backgroundColor: 'white' }}>
            <WaterHeader navigation={navigation} backBut="Batch Info" data={{ batchname }} />
            <View style={styles1.container}>
                <View style={{ flex: 1, marginBottom: 0, marginTop: 10 }}>
                    <View style={{ flex: 1, flexDirection: 'row', marginBottom: 10 }}>
                        <View style={{ flex: 3, alignItems: 'center' }}>
                            <View style={{ flex: 1, justifyContent: 'space-between' }}>
                                <View style={{ alignItems: 'center', alignSelf: 'center' }}>
                                    <Pressable >
                                        {user.acctno === '1' ?
                                            <Ionicons name="location-sharp" size={50} color="red" /> :
                                            <Ionicons name="location-outline" size={50} color="black" />
                                        }
                                    </Pressable>
                                    <Text></Text>
                                    {/* <Text style={{ fontWeight: 'bold' }}>{user.pageNum + 1}</Text> */}
                                </View>
                                {
                                    user.reading === null ?
                                        <View>
                                            {
                                                !user.note ?
                                                    <View style={{ justifyContent: 'space-between', gap: 10 }}>
                                                        <TouchableOpacity onPress={() => setNoteOpen(true)} style={styles1.hold}>
                                                            <Text style={{ color: 'black', fontSize: 17 }}>Hold</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => setOpen(true)} style={styles1.print}>
                                                            <Text style={{ color: 'white', fontSize: 17 }}>Read</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                    :
                                                    <TouchableOpacity onPress={unHold} style={styles1.hold}>
                                                        <Text style={{ color: 'black', fontSize: 17 }}>Un-hold</Text>
                                                    </TouchableOpacity>
                                            }
                                        </View>
                                        :
                                        <View>
                                            {
                                                !user.rate ?
                                                    <View style={{ justifyContent: 'flex-end' }}>
                                                        {!user.note ? <View style={{ justifyContent: 'space-between', gap: 10 }}>
                                                            <TouchableOpacity onPress={() => setNoteOpen(true)} style={styles1.hold}>
                                                                <Text style={{ color: 'black', fontSize: 17 }}>Hold</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={() => {
                                                                setOpen(true)
                                                            }} style={styles1.reRead}>
                                                                <Text style={{ color: 'black', fontSize: 17 }}>Re-read</Text>
                                                            </TouchableOpacity>
                                                            <TouchableOpacity onPress={getRate} style={styles1.print}>
                                                                <Text style={{ color: 'white', fontSize: 17 }}>Print</Text>
                                                            </TouchableOpacity>
                                                        </View> :
                                                            <View style={{ justifyContent: 'space-between', gap: 10 }}>
                                                                <TouchableOpacity onPress={unHold} style={styles1.hold}>
                                                                    <Text style={{ color: 'black', fontSize: 17 }}>Un-hold</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity onPress={() => setOpen(true)} style={styles1.reRead}>
                                                                    <Text style={{ color: 'black', fontSize: 17 }}>Re-read</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        }
                                                    </View> :
                                                    <View style={{ justifyContent: 'flex-end' }}>
                                                        <TouchableOpacity onPress={getRate} style={styles1.print}>
                                                            <Text style={{ color: 'white', fontSize: 17 }}>Print</Text>
                                                        </TouchableOpacity>
                                                    </View>

                                            }
                                        </View>
                                }
                            </View>

                        </View>
                        <View style={{ flex: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <View style={{ justifyContent: 'space-between', flex: 1 }}>
                                <View style={styles1.infoGap}>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Account No:</Text>
                                        <Text style={styles1.infoValue}>{user.acctno}</Text>
                                    </View>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Name:</Text>
                                        <Text style={styles1.infoValue}>{user.acctname}</Text>
                                    </View>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Address:</Text>
                                        <Text style={styles1.infoValue}>{user.location && user.location.replace(/\n/g, '').replace(/  +/g, ' ')}</Text>
                                    </View>
                                </View>
                                <View style={styles1.infoGap}>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Meter Serial No.:</Text>
                                        <Text style={styles1.infoValue}>{user.meterno}</Text>
                                    </View>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Brand:</Text>
                                        <Text style={styles1.infoValue}>{user.brand}</Text>
                                    </View>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Capacity:</Text>
                                        <Text style={styles1.infoValue}>{user.capacity}</Text>
                                    </View>
                                </View>
                                <View style={styles1.infoGap}>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Previous Reading:</Text>
                                        <Text style={styles1.infoValue}>{user.prevreading !== null && ensureFourDecimalPlaces(user.prevreading)}</Text>
                                    </View>
                                    <View style={styles1.info}>
                                        <Text style={styles1.infoName}>Current Reading:</Text>
                                        {user.reading === 0 ? <Text style={styles1.infoValue}>None</Text> :
                                            <Text style={styles1.infoValue}>{user.reading && ensureFourDecimalPlaces(user.reading)}</Text>
                                        }
                                    </View>
                                    {user.reading !== null &&
                                        <View style={styles1.info}>
                                            <Text style={styles1.infoName}>Volume:</Text>
                                            <Text style={styles1.infoValue}>{user.volume && ensureFourDecimalPlaces(user.volume)}</Text>
                                        </View>
                                    }
                                    {user.rate !== null &&
                                        <View style={styles1.info}>
                                            <Text style={styles1.infoName}>Rate:</Text>
                                            <Text style={styles1.infoValue}>{user.rate ? currencyFormat({ val: user.rate, decimal: 2 }) : ""}</Text>
                                        </View>
                                    }
                                </View>
                            </View>
                        </View>
                    </View>


                    {/* Button will change depending if has been read or not */}
                    {open &&
                        <Modal transparent={true} onRequestClose={() => setOpen(false)}>
                            <View style={styles1.modalContainer}>
                                <View style={styles1.modal}>
                                    {/* <View style={styles1.inputContainer}>
                                        <OtpTextInput
                                            otp={otp}
                                            setOtp={setOtp}
                                            digits={5}
                                            style={{ height: 20 }}
                                            fontStyle={{ fontSize: 20, fontWeight: 'bold' }}
                                            focusedStyle={{ borderColor: 'black', borderBottomWidth: 2 }}
                                        />
                                    </View> */}
                                    <View style={styles1.inputContainer}>
                                        {numberValue.map((value, index) => (
                                            <TextInput
                                                style={styles1.inputBox}
                                                value={value}
                                                key={index}
                                                onChangeText={(text) => handleInputChange(text, index)}
                                                maxLength={1}
                                                keyboardType="numeric"
                                                ref={(ref) => (inputRefs.current[index] = ref)}
                                                cursorColor={'black'}
                                                selectTextOnFocus
                                                textAlign='center'
                                                onKeyPress={(e) => handleOnKeyPressNumber(index)}
                                                onFocus={() => {
                                                    if (index > 0 && !numberValue[index - 1]) {
                                                        const prevInput = inputRefs.current[index - 1];

                                                        if (prevInput) {
                                                            prevInput.focus();
                                                        }
                                                    }
                                                }}
                                            />
                                        ))}
                                    </View>
                                    <View style={styles1.inputContainer}>
                                        {decimalValue.map((value, index) => (
                                            <TextInput
                                                style={styles1.decimalBox}
                                                value={value}
                                                key={index}
                                                onChangeText={(text) => handleDecimalChange(text, index)}
                                                maxLength={1}
                                                keyboardType="numeric"
                                                ref={(ref) => (decimalRefs.current[index] = ref)}
                                                cursorColor={'black'}
                                                selectTextOnFocus
                                                textAlign='center'
                                                onKeyPress={() => handleOnKeyPressDecimal(index)}
                                                onFocus={() => {
                                                    if (index > 0 && !decimalValue[index - 1]) {
                                                        const prevInput = decimalRefs.current[index - 1];

                                                        if (prevInput) {
                                                            prevInput.focus();
                                                        }
                                                    }
                                                }}
                                            />
                                        ))}
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 30 }}>
                                        <TouchableOpacity onPress={() => setOpen(false)} style={{ ...styles1.save, backgroundColor: 'white' }}>
                                            <Text style={{ color: 'black' }}>Back</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleSave} style={styles1.save}>
                                            <Text style={{ color: 'white' }}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    }
                    {sigOpen &&
                        <Modal transparent={true} onRequestClose={() => setSigOpen(false)}>
                            <View style={styles1.modalContainer}>
                                <View style={styles1.signModal}>
                                    <Text>Please enter name of the receiver.</Text>
                                    <TextInput placeholder='Name of Receiver' value={receiver} onChangeText={(text) => setReceiver(text)} style={{ borderWidth: 1, padding: 5 }} />
                                    {/* <Signature
                                        ref={signatureRef}
                                        onOK={handleOK}
                                        onEnd={handleEndDrawing}
                                        webStyle={webStyle}
                                        trimWhitespace={true}
                                        backgroundColor='#fff'
                                        imageType="image/jpeg"
                                        style={{ borderWidth: 1, height: 20 }}
                                    /> */}
                                    <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View style={{ flex: 1, flexDirection: 'row', gap: 15 }}>
                                            <TouchableOpacity style={{ borderWidth: 1, padding: 5, borderRadius: 5, alignItems: 'center' }} onPress={handleCancel}>
                                                <Text style={{ fontSize: 12, textAlign: 'center' }}>Cancel</Text>
                                            </TouchableOpacity>
                                            {/* <TouchableOpacity style={{ borderRadius: 5, padding: 5, alignItems: 'center', backgroundColor: 'white' }} onPress={() => {
                                                signatureRef.current.clearSignature()
                                                setSignatureData("")
                                            }}>
                                                <FontAwesome name="repeat" size={20} color="black" />
                                            </TouchableOpacity> */}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <TouchableOpacity style={{ alignSelf: 'flex-end', padding: 5, backgroundColor: 'green', borderRadius: 5 }} onPress={handleConfirm}>
                                                <Text style={{ color: 'white' }}>Confirm</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    }
                    {rateOpenOk &&
                        <Modal transparent={true} onRequestClose={() => setSigOpen(false)}>
                            <View style={styles1.modalContainer}>
                                <View style={styles1.rateModal}>
                                    <View style={{ flex: 1 }}>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text>Due Date</Text>
                                            <Text>{computedRef.current.duedate}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}></View>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text>Current Reading</Text>
                                            <Text>{user.volume && ensureFourDecimalPlaces(user.reading)}</Text>
                                        </View>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text>Previous Reading</Text>
                                            <Text>{user.volume && ensureFourDecimalPlaces(user.prevreading)}</Text>
                                        </View>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text>Volume</Text>
                                            <Text>{user.volume && ensureFourDecimalPlaces(user.volume)}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}></View>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text>Rate</Text>
                                            <Text>{computedRef.current.rate ? currencyFormat({ val: computedRef.current.rate, decimal: 2 }) : ""}</Text>
                                        </View>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text>Previous Balance</Text>
                                            <Text>{computedRef.current.balance ? currencyFormat({ val: computedRef.current.balance, decimal: 2 }) : ""}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}></View>
                                        <View style={{ justifyContent: 'space-between', flexDirection: 'row' }}>
                                            <Text style={{ fontWeight: 'bold' }}>Total</Text>
                                            <Text style={{ fontWeight: 'bold' }}>{computedRef.current.total ? currencyFormat({ val: computedRef.current.total, decimal: 2 }) : ""}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 }}>
                                        <TouchableOpacity onPress={() => setRateOpenOk(false)} style={{ borderWidth: 1, padding: 5, borderRadius: 5 }}>
                                            <Text>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleConfirm} style={{ backgroundColor: 'green', padding: 5, borderRadius: 5 }}>
                                            <Text style={{ color: 'white' }}>Continue</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    }
                    {noteOpen &&
                        <Modal transparent={true} onRequestClose={() => setOpen(false)}>
                            <View style={styles1.modalContainer}>
                                <View style={styles1.noteModal}>
                                    <View style={{ gap: 10 }}>
                                        {!edit && <Text style={{ alignSelf: 'center' }}>Hold the account</Text>}
                                        <Text>{edit ? "Edit note:" : "Put a note:"}</Text>
                                        <TextInput
                                            style={{ borderWidth: 1, height: 100, textAlignVertical: 'top', padding: 5 }}
                                            value={noteInput}
                                            multiline={true}
                                            numberOfLines={10}
                                            onChangeText={(inputText) => setNoteInput(inputText)}
                                        />

                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                                        <TouchableOpacity onPress={() => setNoteOpen(false)} style={{ ...styles1.save, backgroundColor: 'white', width: 100 }}>
                                            <Text style={{ color: 'black' }}>Cancel</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={saveNote} style={{ ...styles1.save, width: 100 }}>
                                            <Text style={{ color: 'white' }}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </Modal>
                    }
                </View>
                <View style={{ gap: 10, height: 80, paddingHorizontal: 20 }}>
                    {user.note &&
                        <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                                <Text style={{ fontWeight: 'bold', alignSelf: 'center', textAlign: 'center' }}>Note</Text>
                                <Pressable onPress={editNote}>
                                    <FontAwesome6 name="edit" size={15} color="black" />
                                </Pressable>
                            </View>
                            <Text style={{ marginTop: 5 }}>{user.note}</Text>
                        </View>
                    }
                </View>
            </View>
            {/* {(!open && !noteOpen) && <TouchableOpacity onPress={() => navigation.navigate('Batch Info', { batchname })} style={styles.backButton}>
                <Text style={{ color: 'black' }}>Back to List</Text>
            </TouchableOpacity>} */}
        </View>
    )
}

export default UserInfo