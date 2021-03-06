import React, {useEffect, useState} from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';

import * as OkaySdk from 'react-native-okay-sdk';
import messaging from '@react-native-firebase/messaging';

let deviceToken;
let installationID = Platform.OS === 'android' ? '9990' : '9980';
const pubPssBase64 =
  'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxgyacF1NNWTA6rzCrtK60se9fVpTPe3HiDjHB7MybJvNdJZIgZbE9k3gQ6cdEYgTOSG823hkJCVHZrcf0/AK7G8Xf/rjhWxccOEXFTg4TQwmhbwys+sY/DmGR8nytlNVbha1DV/qOGcqAkmn9SrqW76KK+EdQFpbiOzw7RRWZuizwY3BqRfQRokr0UBJrJrizbT9ZxiVqGBwUDBQrSpsj3RUuoj90py1E88ExyaHui+jbXNITaPBUFJjbas5OOnSLVz6GrBPOD+x0HozAoYuBdoztPRxpjoNIYvgJ72wZ3kOAVPAFb48UROL7sqK2P/jwhdd02p/MDBZpMl/+BG+qQIDAQAB';

async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  console.log('status: ', authStatus);
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  if (enabled) {
    console.log('Authorization status:', authStatus);
    messaging()
      .getToken()
      .then(token => {
        console.log('token: ', token);
        OkaySdk.updateDeviceToken(token || '');
      });
  }
}

async function initAndroidSdk() {
  //      buttonBackgroundColor: '#f9a825',
  //       buttonTextColor: '#000000',
  OkaySdk.initOkay({
    okayUrlEndpoint: 'https://demostand.okaythis.com',
    fontConfig: [
      {
        fontVariant: 'FiraGO_200italic',
        fontAssetPath: 'fonts/firago_eightitalic.ttf',
      },
    ],
  })
    .then(response => {
      console.log('init: ', response);
    })
    .catch(error => {
      console.error('error: ', error);
    });
}

async function initIosSdk() {
  requestUserPermission();
  OkaySdk.initOkay({
    okayUrlEndpoint: 'https://demostand.okaythis.com',
    resourceProvider: {
      biometricAlertReasonText: 'Test Alert',
    },
  })
    .then(response => {
      console.log('init: ', response);
    })
    .catch(error => {
      console.error('error: ', error);
    });
}

const App = () => {
  const [linkingCode, setCode] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [externalId, setExternalId] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    console.log('sdk: ', OkaySdk);
    switch (Platform.OS) {
      case 'android':
        initAndroidSdk();
        break;
      case 'ios':
        initIosSdk();
        break;
    }

    const unsubscribe = messaging().onMessage(async message => {
      console.log('message: ', message);
      let data = JSON.parse(message.data.data);
      console.log('Data: ', data.sessionId);
      console.log('Params: ', data.params.DEVICE_UI_TYPE);
      let response = await OkaySdk.startAuthorization({
        deviceUiType: data.params.DEVICE_UI_TYPE,
        sessionId: data.sessionId,
        appPns: deviceToken,
        pageTheme: {
          screenBackgroundColor: '#ffffff',
          actionBarBackgroundColor: '#004ba0',
          actionBarTextColor: '#ffd95a',
          pinNumberButtonTextColor: '#000000',
          pinNumberButtonBackgroundColor: '#ffd95a',
          pinRemoveButtonBackgroundColor: '#ffd95a',
          pinRemoveButtonTextColor: '#000000',
          pinTitleTextColor: '#ffffff',
          pinValueTextColor: '#ffffff',
          titleTextColor: '#ffd95a',
          questionMarkColor: '#63a4ff',
          transactionTypeTextColor: '#000000',
          authInfoBackgroundColor: '#ffd95a',
          infoSectionTitleColor: '#ffffff',
          infoSectionValueColor: '#000000',
          fromTextColor: '#000000',
          messageTextColor: '#000000',
          confirmButtonBackgroundColor: '#ffd95a',
          confirmButtonTextColor: '#000000',
          cancelButtonBackgroundColor: '#63a4ff',
          cancelButtonTextColor: '#ffffff',
          authConfirmationButtonBackgroundColor: '#f9a825',
          authConfirmationButtonTextColor: '#000000',
          authCancellationButtonBackgroundColor: '#1976d2',
          authCancellationButtonTextColor: '#ffffff',
          nameTextColor: '#000000',
          buttonBackgroundColor: '#63a4ff',
          buttonTextColor: '#ffffff',
          inputTextColor: '#000000',
          inputSelectionColor: '#00FF00',
          inputErrorColor: '#FF0000',
          inputDefaultColor: '#888888',
        },
      });
      console.log(response);
    });
    return unsubscribe;
  }, []);

  const enrollDevice = async () => {
    try {
      console.log('get token');
      deviceToken = await messaging().getToken();
      setToken(deviceToken);
      console.log('token: ', deviceToken);
      const response = await OkaySdk.startEnrollment({
        appPns: deviceToken,
        pubPss: pubPssBase64,
        enrollInBackground: true,
        installationId: installationID,
      });
      console.log('ext: ', response);
      // let parsedData = JSON.parse(response);
      // setExternalId(parsedData.externalId);
      setExternalId(response.externalId);
    } catch (error) {
      console.error('error: ', error);
    }
  };

  const linkDevice = async () => {
    try {
      const linkResult = await OkaySdk.linkTenant(linkingCode, {
        appPns: token,
        pubPss: pubPssBase64,
        externalId: externalId,
        installationId: installationID,
        enrollmentId: null,
      });
      console.log('linkResult: ', linkResult);
    } catch (error) {
      console.error(error);
    }
  };
  const unlinkDevice = async () => {
    try {
      const unlinkResult = await OkaySdk.unlinkTenant(tenantId, {
        appPns: token,
        pubPss: pubPssBase64,
        externalId: externalId,
        installationId: installationID,
        enrollmentId: null,
      });
      console.log('unlinkRes: ', unlinkResult);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <SafeAreaView>
      <Text>Your externalId: {externalId}</Text>
      <Text>Your deviceToken: {token}</Text>
      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={enrollDevice}>
          <Text style={styles.buttonText}>Enroll device</Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Enter linking code"
          value={linkingCode}
          onChangeText={setCode}
        />
        <TouchableOpacity style={styles.button} onPress={linkDevice}>
          <Text style={styles.buttonText}>Link device</Text>
        </TouchableOpacity>
        <TextInput
          placeholder="Enter tenant ID"
          value={tenantId}
          onChangeText={setTenantId}
        />
        <TouchableOpacity style={styles.button} onPress={unlinkDevice}>
          <Text style={styles.buttonText}>Unlink tenant</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '80%',
  },
  button: {
    width: 200,
    height: 75,
    backgroundColor: 'blue',
    color: 'white',
    justifyContent: 'center',
    margin: 10,
  },
  buttonText: {
    color: 'white',
    alignSelf: 'center',
  },
});

export default App;
