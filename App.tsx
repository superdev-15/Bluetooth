import React from 'react';
import type {PropsWithChildren} from 'react';

import { BleManager, Device } from 'react-native-ble-plx';
import { useState, useEffect } from 'react';
import { PermissionsAndroid, Platform, Alert, Button } from 'react-native';

import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  Header,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';

type SectionProps = PropsWithChildren<{
  title: string;
}>;

function Section({children, title}: SectionProps): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  return (
    <View style={styles.sectionContainer}>
      <Text
        style={[
          styles.sectionTitle,
          {
            color: isDarkMode ? Colors.white : Colors.black,
          },
        ]}>
        {title}
      </Text>
      <Text
        style={[
          styles.sectionDescription,
          {
            color: isDarkMode ? Colors.light : Colors.dark,
          },
        ]}>
        {children}
      </Text>
    </View>
  );
}

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    height: '100%',
  };

  const bleManager = new BleManager()
  const [device, setDevice] = useState<Device | null>(null);

  useEffect(() => {
    // Request permissions for Android
    const requestPermissions = async () => {
      if (Platform.OS === 'ios') {
        return true
      }
      if (Platform.OS === 'android' && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
        const apiLevel = parseInt(Platform.Version.toString(), 10)
    
        if (apiLevel < 31) {
          const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
          return granted === PermissionsAndroid.RESULTS.GRANTED
        }
        if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
          const result = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          ])
    
          return (
            result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
            result['android.permission.ACCESS_FINE_LOCATION'] === PermissionsAndroid.RESULTS.GRANTED
          )
        }
      }
    
      Alert.alert('Permission have not been granted')
    
      return false
    };

    requestPermissions();

    // Cleanup on unmount
    return () => {
      bleManager.destroy();
    };
  }, [bleManager]);

  useEffect(() => {
    const subscription = bleManager.onStateChange(state => {
      if (state === 'PoweredOn') {
        scanDevice()
        subscription.remove()
      }
    }, true)
    return () => subscription.remove()
  }, [bleManager])
  
  const scanDevice = () => {
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Error while scanning: ', error);
        return;
      }
      console.log('Device found: ', device?.id);
      
      if (device?.name === 'TI BLE Sensor Tag' || device?.name === 'SensorTag') {
        // Stop scanning as it's not necessary if you are scanning for one device.
        bleManager.stopDeviceScan()
      }

      setDevice(device);
    });
  };

  const stopDeviceScan = () => {
    bleManager.stopDeviceScan();
    setDevice(null);
  };

  const connectToDevice = () => {
    if (device) {
      device.connect()
        .then((connectedDevice) => {
          return connectedDevice.discoverAllServicesAndCharacteristics();
        })
        .then((connectedDevice) => {
          console.log(connectedDevice.name)
          console.log('Connected to device: ', connectedDevice);
        })
        .catch((error) => {
          console.log('Connection error: ', error);
        });
    } else {
      console.log('No device selected');
    }
  };
  return (
    <SafeAreaView style={{...backgroundStyle, height: '100%'}}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{...backgroundStyle, height: '100%'}}>
        <View>
          <Text style={{textAlign: 'center', fontSize: 20, fontWeight: 'bold', marginTop: 100}}>Bluetooth App</Text>
        </View>
        <View
          style={{
            backgroundColor: isDarkMode ? Colors.black : Colors.white,
            marginTop: 100,
          }}>
          <View style={{marginBottom: 20}}>
            <Button title="Scan Device" onPress={scanDevice}/>
          </View>

          <View style={{marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <Text>{device?.name}</Text>
            <Text>{device?.id}</Text>
          </View>
          <Button title="Connect to Device" onPress={connectToDevice} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
